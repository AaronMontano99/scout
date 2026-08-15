/**
 * Real, local-first CSV/XLSX import pipeline — see
 * src/services/local-import-provider.ts (parsing + deterministic
 * column-mapping) and src/domain/entity-resolution.ts (matching,
 * reused as-is — never a parallel duplicate-detection system here per
 * the master integration spec). Upload -> Map -> Validate -> Resolve
 * -> Import, all persisted in SQLite so progress survives a refresh.
 */
import { getDb } from '@/db/client';
import { getAccount, createAccount, createContact, addKnowledgeItem, recordAnalyticsEvent, createTargetList } from './index';
import { resolveAccount, type ResolutionCandidate } from '@/domain/entity-resolution';
import { localImportProvider } from '@/services/local-import-provider';

function uuid(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}
function row(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...(params as never[]));
}
function rows(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  return getDb().prepare(sql).all(...(params as never[]));
}

export type ImportStatus = 'uploaded' | 'mapping' | 'processing' | 'completed' | 'failed';
export type ImportRowStatus = 'pending' | 'imported' | 'needs_review' | 'failed';

export interface ImportMappingConfig {
  fields: Record<string, string>; // source column header -> target field id
  listName: string | null;
}

export interface ImportRecord {
  id: string;
  fileName: string;
  fileType: 'csv' | 'xlsx';
  status: ImportStatus;
  mapping: ImportMappingConfig;
  rowCount: number;
  errorCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface ImportRowRecord {
  id: string;
  importId: string;
  rowNumber: number;
  data: Record<string, string>;
  resolutionStatus: ImportRowStatus;
  matchedAccountId: string | null;
  matchCandidateId: string | null;
  error: string | null;
}

function parseMapping(text: string | null): ImportMappingConfig {
  if (!text) return { fields: {}, listName: null };
  try {
    const parsed = JSON.parse(text) as Partial<ImportMappingConfig>;
    return { fields: parsed.fields ?? {}, listName: parsed.listName ?? null };
  } catch {
    return { fields: {}, listName: null };
  }
}

function mapImport(r: Record<string, unknown>): ImportRecord {
  return {
    id: r.id as string,
    fileName: r.file_name as string,
    fileType: r.file_type as 'csv' | 'xlsx',
    status: r.status as ImportStatus,
    mapping: parseMapping(r.column_mapping as string | null),
    rowCount: (r.row_count as number) ?? 0,
    errorCount: (r.error_count as number) ?? 0,
    createdAt: r.created_at as string,
    completedAt: (r.completed_at as string | null) ?? null,
  };
}

function mapImportRow(r: Record<string, unknown>): ImportRowRecord {
  return {
    id: r.id as string,
    importId: r.import_id as string,
    rowNumber: r.row_number as number,
    data: JSON.parse(r.raw_data as string) as Record<string, string>,
    resolutionStatus: r.resolution_status as ImportRowStatus,
    matchedAccountId: (r.matched_account_id as string | null) ?? null,
    matchCandidateId: (r.match_candidate_id as string | null) ?? null,
    error: (r.error as string | null) ?? null,
  };
}

const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10MB — generous for a spreadsheet, small enough to keep sql.js's whole-file rewrite-on-write cheap.

export class ImportValidationError extends Error {}

export function listImports(): ImportRecord[] {
  return rows('SELECT * FROM imports ORDER BY created_at DESC').map(mapImport);
}

export function getImport(id: string): ImportRecord | null {
  const r = row('SELECT * FROM imports WHERE id = ?', [id]);
  return r ? mapImport(r) : null;
}

export function getImportRows(importId: string): ImportRowRecord[] {
  return rows('SELECT * FROM import_rows WHERE import_id = ? ORDER BY row_number ASC', [importId]).map(mapImportRow);
}

export function getImportHeaders(importId: string): string[] {
  const first = getImportRows(importId)[0];
  return first ? Object.keys(first.data) : [];
}

/** Step 1 — Upload. Parses the file synchronously and stores every row so later steps never need to re-touch the original file. */
export async function createImportFromUpload(
  fileName: string,
  fileType: 'csv' | 'xlsx',
  buffer: Buffer,
  listName: string | null
): Promise<ImportRecord> {
  if (buffer.byteLength > MAX_IMPORT_BYTES) {
    throw new ImportValidationError(`File is too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Limit is 10MB.`);
  }

  const table = await localImportProvider.parse(buffer, fileType);
  if (table.rowCount === 0) {
    throw new ImportValidationError('No data rows found in this file.');
  }

  const id = uuid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO imports (id, file_name, file_type, status, column_mapping, row_count, error_count, created_at)
       VALUES (?, ?, ?, 'uploaded', ?, ?, 0, ?)`
    )
    .run(id, fileName, fileType, JSON.stringify({ fields: {}, listName: listName || null }), table.rowCount, now);

  const insertRow = getDb().prepare(
    `INSERT INTO import_rows (id, import_id, row_number, raw_data, resolution_status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`
  );
  table.rows.forEach((data, idx) => insertRow.run(uuid(), id, idx + 1, JSON.stringify(data), now));

  return getImport(id)!;
}

/** Step 2 — Map columns. User-confirmed mapping only; nothing is written to accounts/contacts yet. */
export function saveColumnMapping(importId: string, fields: Record<string, string>): ImportRecord {
  const current = getImport(importId);
  if (!current) throw new ImportValidationError('Import not found');
  const mapping: ImportMappingConfig = { fields, listName: current.mapping.listName };
  getDb()
    .prepare(`UPDATE imports SET status = 'mapping', column_mapping = ? WHERE id = ?`)
    .run(JSON.stringify(mapping), importId);
  return getImport(importId)!;
}

function mappedValue(data: Record<string, string>, fields: Record<string, string>, target: string): string | null {
  const header = Object.entries(fields).find(([, t]) => t === target)?.[0];
  if (!header) return null;
  const value = data[header]?.trim();
  return value ? value : null;
}

export interface ValidationSummary {
  ready: number;
  needsReview: number;
  duplicates: number;
  failed: number;
  total: number;
  issues: { rowNumber: number; issue: string; fix: string }[];
}

/** Step 3/4 — Validate + resolve matches. Reuses domain/entity-resolution.ts; a 'review' verdict always creates an AccountMatchCandidate row, never a silent merge. Idempotent: safe to re-run (clears its own prior candidates first). */
export function runValidation(importId: string): ValidationSummary {
  const importRecord = getImport(importId);
  if (!importRecord) throw new ImportValidationError('Import not found');
  const { fields } = importRecord.mapping;
  const dataRows = getImportRows(importId);

  // Clear any candidates/decisions from a previous run of this step so re-running is safe.
  for (const r of dataRows) {
    if (r.matchCandidateId) {
      getDb().prepare('DELETE FROM account_match_candidates WHERE id = ?').run(r.matchCandidateId);
    }
  }
  getDb()
    .prepare(
      `UPDATE import_rows SET resolution_status = 'pending', matched_account_id = NULL, match_candidate_id = NULL, error = NULL WHERE import_id = ?`
    )
    .run(importId);

  const existingAccounts = rows('SELECT id, name, primary_domain FROM accounts');
  const candidates: ResolutionCandidate[] = existingAccounts.map((a) => ({
    accountId: a.id as string,
    name: a.name as string,
    domain: (a.primary_domain as string | null) ?? undefined,
  }));

  const issues: ValidationSummary['issues'] = [];
  let ready = 0;
  let needsReview = 0;
  let failed = 0;

  for (const r of dataRows) {
    const accountName = mappedValue(r.data, fields, 'account_name');
    const domain = mappedValue(r.data, fields, 'domain');

    if (!accountName && !domain) {
      getDb()
        .prepare(`UPDATE import_rows SET resolution_status = 'failed', error = ? WHERE id = ?`)
        .run('Missing account name or domain', r.id);
      failed += 1;
      issues.push({ rowNumber: r.rowNumber, issue: 'Missing account name or domain', fix: 'Map a column to Account Name or Domain, or remove this row from the source file.' });
      continue;
    }

    const match = resolveAccount({ name: accountName ?? domain!, domain: domain ?? undefined }, candidates);

    if (match.verdict === 'auto_apply') {
      getDb().prepare(`UPDATE import_rows SET matched_account_id = ? WHERE id = ?`).run(match.accountId, r.id);
      ready += 1;
    } else if (match.verdict === 'review') {
      const candidateId = uuid();
      getDb()
        .prepare(
          `INSERT INTO account_match_candidates (id, raw_name, raw_domain, raw_source, candidate_account_id, match_confidence, match_method, status, created_at)
           VALUES (?, ?, ?, 'import_row', ?, ?, ?, 'pending', ?)`
        )
        .run(candidateId, accountName ?? domain, domain ?? null, match.accountId, match.confidence, match.method, nowIso());
      getDb()
        .prepare(`UPDATE import_rows SET resolution_status = 'needs_review', match_candidate_id = ? WHERE id = ?`)
        .run(candidateId, r.id);
      needsReview += 1;
      issues.push({
        rowNumber: r.rowNumber,
        issue: `"${accountName ?? domain}" may already exist as an account`,
        fix: 'Resolve this match — merge into the existing account or create a new one.',
      });
    } else {
      ready += 1; // no_match — will create a new account at commit
    }
  }

  return { ready, needsReview, duplicates: needsReview, failed, total: dataRows.length, issues };
}

export interface ReviewRow extends ImportRowRecord {
  candidateAccountName: string | null;
}

/** Rows still needing a merge/create-new decision, with the candidate account's name resolved for display. */
export function getReviewRows(importId: string): ReviewRow[] {
  return getImportRows(importId)
    .filter((r) => r.resolutionStatus === 'needs_review')
    .map((r) => {
      if (!r.matchCandidateId) return { ...r, candidateAccountName: null };
      const candidate = row('SELECT * FROM account_match_candidates WHERE id = ?', [r.matchCandidateId]);
      const accountId = candidate?.candidate_account_id as string | undefined;
      const account = accountId ? row('SELECT name FROM accounts WHERE id = ?', [accountId]) : undefined;
      return { ...r, candidateAccountName: (account?.name as string | undefined) ?? null };
    });
}

/** Step 4 (per-row decision). */
export function resolveImportRow(rowId: string, decision: 'merge' | 'create_new'): void {
  const r = row('SELECT * FROM import_rows WHERE id = ?', [rowId]);
  if (!r) throw new ImportValidationError('Row not found');
  const mapped = mapImportRow(r);
  if (!mapped.matchCandidateId) throw new ImportValidationError('Row has no candidate to resolve');
  const candidate = row('SELECT * FROM account_match_candidates WHERE id = ?', [mapped.matchCandidateId]);

  if (decision === 'merge' && candidate) {
    getDb()
      .prepare(`UPDATE import_rows SET resolution_status = 'pending', matched_account_id = ? WHERE id = ?`)
      .run(candidate.candidate_account_id as string, rowId);
    getDb().prepare(`UPDATE account_match_candidates SET status = 'confirmed', reviewed_at = ? WHERE id = ?`).run(nowIso(), mapped.matchCandidateId);
  } else {
    getDb().prepare(`UPDATE import_rows SET resolution_status = 'pending', matched_account_id = NULL WHERE id = ?`).run(rowId);
    getDb().prepare(`UPDATE account_match_candidates SET status = 'rejected', reviewed_at = ? WHERE id = ?`).run(nowIso(), mapped.matchCandidateId);
  }
}

function splitName(full: string): { firstName?: string; lastName?: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

export interface ImportCommitSummary {
  accountsCreated: number;
  accountsMatched: number;
  contactsCreated: number;
  knowledgeItemsCreated: number;
  failedRows: number;
  listId: string | null;
  listName: string | null;
}

/** Step 5 — commit. Refuses to run while any row is still needs_review — no silent writes. */
export function commitImport(importId: string): ImportCommitSummary {
  const importRecord = getImport(importId);
  if (!importRecord) throw new ImportValidationError('Import not found');
  const dataRows = getImportRows(importId);
  if (dataRows.some((r) => r.resolutionStatus === 'needs_review')) {
    throw new ImportValidationError('Resolve every flagged match before importing.');
  }

  const { fields, listName } = importRecord.mapping;
  const list = listName ? createTargetList({ name: listName }) : null;

  let accountsCreated = 0;
  let accountsMatched = 0;
  let contactsCreated = 0;
  let knowledgeItemsCreated = 0;
  let failedRows = 0;

  for (const r of dataRows) {
    if (r.resolutionStatus === 'failed') {
      failedRows += 1;
      continue;
    }

    const accountName = mappedValue(r.data, fields, 'account_name');
    const domain = mappedValue(r.data, fields, 'domain');
    const contactName = mappedValue(r.data, fields, 'contact_name');
    const contactTitle = mappedValue(r.data, fields, 'contact_title');
    const contactEmail = mappedValue(r.data, fields, 'contact_email');
    const contactPhone = mappedValue(r.data, fields, 'contact_phone');
    const note = mappedValue(r.data, fields, 'knowledge_note');

    let account = r.matchedAccountId ? getAccount(r.matchedAccountId) : null;
    if (account) {
      accountsMatched += 1;
    } else {
      account = createAccount({ name: accountName ?? domain!, primaryDomain: domain ?? undefined });
      accountsCreated += 1;
    }

    if (contactName) {
      createContact(account.id, { ...splitName(contactName), title: contactTitle ?? undefined, email: contactEmail ?? undefined, phone: contactPhone ?? undefined });
      contactsCreated += 1;
      recordAnalyticsEvent({ eventType: 'contact_added', accountId: account.id });
    }

    if (note) {
      addKnowledgeItem(account.id, note, 'note', 'imported');
      knowledgeItemsCreated += 1;
    }

    if (list) {
      const existingMembership = row('SELECT 1 FROM target_list_items WHERE target_list_id = ? AND account_id = ?', [list.id, account.id]);
      if (!existingMembership) {
        getDb()
          .prepare(`INSERT INTO target_list_items (id, target_list_id, account_id, status, pinned, added_at) VALUES (?, ?, ?, 'not_started', 0, ?)`)
          .run(uuid(), list.id, account.id, nowIso());
      }
    }

    getDb().prepare(`UPDATE import_rows SET resolution_status = 'imported', matched_account_id = ? WHERE id = ?`).run(account.id, r.id);
  }

  getDb()
    .prepare(`UPDATE imports SET status = 'completed', error_count = ?, completed_at = ? WHERE id = ?`)
    .run(failedRows, nowIso(), importId);

  return { accountsCreated, accountsMatched, contactsCreated, knowledgeItemsCreated, failedRows, listId: list?.id ?? null, listName: list?.name ?? null };
}
