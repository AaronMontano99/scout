/**
 * Persists research evidence already fetched by a ResearchProvider —
 * pure DB writes, no network I/O, so this stays fast/deterministic to
 * test independently of the live provider. See
 * src/services/free-web-research-provider.ts for the fetch side and
 * docs/RESEARCH_ARCHITECTURE.md for the pipeline this is one step of.
 */
import { getDb } from '@/db/client';
import type { RawEvidence } from '@/types/evidence';

function uuid(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}
function row(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...(params as never[]));
}

export interface SaveResearchResult {
  runId: string;
  findingsSaved: number;
  findingsSkipped: number;
}

/**
 * Writes a Source + ResearchFinding row per piece of evidence, and one
 * ResearchRun row summarizing the attempt — always SUGGESTED certainty
 * (automated, unverified pull), never auto-promoted. Skips evidence
 * whose URL already has a stored finding for this account, so
 * repeated "Refresh Research" clicks don't pile up duplicates.
 */
export function saveResearchFindings(
  accountId: string,
  evidence: RawEvidence[],
  triggerType: 'initial_import' | 'user_request' = 'user_request'
): SaveResearchResult {
  const db = getDb();
  const now = nowIso();
  const runId = uuid();

  db.prepare(
    `INSERT INTO research_runs (id, account_id, trigger_type, status, started_at, completed_at, provider_calls, cache_used, created_at)
     VALUES (?, ?, ?, 'completed', ?, ?, ?, 0, ?)`
  ).run(runId, accountId, triggerType, now, now, JSON.stringify({ provider: 'free-web-research', evidenceCount: evidence.length }), now);

  let saved = 0;
  let skipped = 0;

  for (const item of evidence) {
    if (item.sourceUrl) {
      const existing = row('SELECT 1 FROM research_findings WHERE account_id = ? AND url = ?', [accountId, item.sourceUrl]);
      if (existing) {
        skipped += 1;
        continue;
      }
    }

    const sourceId = uuid();
    let publisherDomain: string | null = null;
    try {
      publisherDomain = item.sourceUrl ? new URL(item.sourceUrl).hostname : null;
    } catch {
      publisherDomain = null;
    }

    db.prepare(
      `INSERT INTO sources (id, type, name, url, reliability_weight, source_tier, publisher_domain, title, extraction_status, created_at)
       VALUES (?, 'web', ?, ?, 0.5, 4, ?, ?, 'extracted', ?)`
    ).run(sourceId, item.sourceName, item.sourceUrl ?? null, publisherDomain, item.sourceName, now);

    db.prepare(
      `INSERT INTO research_findings (id, account_id, research_run_id, source_id, finding_type, content, url, retrieved_at, relevant_date, confidence, certainty_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUGGESTED', ?)`
    ).run(
      uuid(),
      accountId,
      runId,
      sourceId,
      item.sourceUrl?.includes('news.google.com') ? 'news' : 'company_website',
      item.content,
      item.sourceUrl ?? null,
      item.retrievedAt,
      item.relevantDate ?? null,
      item.confidence ?? 0.4,
      now
    );
    saved += 1;
  }

  return { runId, findingsSaved: saved, findingsSkipped: skipped };
}

export function getResearchRunsForAccount(accountId: string) {
  return getDb()
    .prepare('SELECT * FROM research_runs WHERE account_id = ? ORDER BY created_at DESC')
    .all(accountId);
}
