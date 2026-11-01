/**
 * Accounts: the companies Aaron is calling or emailing. Created the
 * first time he says "I'm calling/emailing X" and matched by name after
 * that, so notes, research, and history build up on one record.
 */
import { getDb, type SqlValue } from '@/db/client';

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  address: string | null;
  zip: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

function row(sql: string, params: SqlValue[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...params);
}
function rows(sql: string, params: SqlValue[] = []): Record<string, unknown>[] {
  return getDb().prepare(sql).all(...params);
}

function mapAccount(r: Record<string, unknown>): Account {
  return {
    id: r.id as string,
    name: r.name as string,
    domain: (r.domain as string) ?? null,
    industry: (r.industry as string) ?? null,
    address: (r.address as string) ?? null,
    zip: (r.zip as string) ?? null,
    phone: (r.phone as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

const LEGAL_SUFFIXES = /\b(inc|incorporated|llc|l\.l\.c|ltd|limited|corp|corporation|co|company|lp|llp|pllc|pc|plc|gmbh)\b\.?/g;

/** "Northgate Fabrication, Inc." → "northgate fabrication". Used to match "I'm calling northgate fabrication" to an existing account. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDomain(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleaned) ? cleaned : null;
}

export function getAccount(id: string): Account | null {
  const r = row('SELECT * FROM accounts WHERE id = ?', [id]);
  return r ? mapAccount(r) : null;
}

export function findAccountByName(name: string): Account | null {
  const normalized = normalizeCompanyName(name);
  if (!normalized) return null;
  const r = row('SELECT * FROM accounts WHERE normalized_name = ? ORDER BY updated_at DESC LIMIT 1', [normalized]);
  return r ? mapAccount(r) : null;
}

export function createAccount(input: { name: string; domain?: string | null; industry?: string | null; address?: string | null; zip?: string | null; phone?: string | null }): Account {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO accounts (id, name, normalized_name, domain, industry, address, zip, phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.name.trim(),
      normalizeCompanyName(input.name),
      input.domain ? normalizeDomain(input.domain) : null,
      input.industry ?? null,
      input.address ?? null,
      input.zip ?? null,
      input.phone ?? null,
      now,
      now
    );
  return getAccount(id)!;
}

/** The "I'm calling X" entry point: reuse the account if Scout already knows it, otherwise start one. */
export function findOrCreateAccount(name: string, domain?: string | null): { account: Account; isNew: boolean } {
  const existing = findAccountByName(name);
  if (existing) {
    const cleanDomain = domain ? normalizeDomain(domain) : null;
    if (cleanDomain && !existing.domain) {
      getDb().prepare('UPDATE accounts SET domain = ?, updated_at = ? WHERE id = ?').run(cleanDomain, new Date().toISOString(), existing.id);
      return { account: getAccount(existing.id)!, isNew: false };
    }
    return { account: existing, isNew: false };
  }
  return { account: createAccount({ name, domain }), isNew: true };
}

/** Keeps the account's own office details in sync with the latest research. */
export function updateAccountFromResearch(id: string, patch: { address?: string; zip?: string; phone?: string }): void {
  const sets: string[] = [];
  const values: SqlValue[] = [];
  for (const [col, value] of Object.entries(patch)) {
    if (value) {
      sets.push(`${col} = ?`);
      values.push(value);
    }
  }
  if (sets.length === 0) return;
  getDb()
    .prepare(`UPDATE accounts SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...values, new Date().toISOString(), id);
}

export function updateAccountDetails(id: string, patch: Partial<Pick<Account, 'domain' | 'industry' | 'address' | 'zip' | 'phone'>>): void {
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (keys.length === 0) return;
  const values = keys.map((k) => {
    const value = patch[k]?.trim() || null;
    return k === 'domain' && value ? (normalizeDomain(value) ?? value) : value;
  });
  getDb()
    .prepare(`UPDATE accounts SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...values, new Date().toISOString(), id);
}

export function touchAccount(id: string): void {
  getDb().prepare('UPDATE accounts SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

export interface RecentAccount {
  account: Account;
  lastCallCardAt: string | null;
  lastEmailAt: string | null;
}

/** Most recently worked accounts, for the "pick up where you left off" list on Calls and Emails. */
export function getRecentAccounts(limit = 12): RecentAccount[] {
  return rows(
    `SELECT a.*,
       (SELECT MAX(created_at) FROM sdr_drafts d WHERE d.account_id = a.id AND d.kind = 'call_card') AS last_card,
       (SELECT MAX(created_at) FROM sdr_drafts d WHERE d.account_id = a.id AND d.kind = 'email') AS last_email
     FROM accounts a ORDER BY a.updated_at DESC LIMIT ?`,
    [limit]
  ).map((r) => ({ account: mapAccount(r), lastCallCardAt: (r.last_card as string) ?? null, lastEmailAt: (r.last_email as string) ?? null }));
}
