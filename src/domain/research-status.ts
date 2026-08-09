import type { AccountResearchStatus } from '@/types/product';

/**
 * Account research status state machine — see docs/RESEARCH_ENGINE.md
 * and product spec §5-6. Deliberately a small, explicit transition
 * graph rather than a free-for-all enum: the UI (and the founder's
 * operational diagnostics) depend on knowing which states are
 * reachable from which, and an invalid transition here is a real bug,
 * not a modeling nuance.
 *
 * This is the coarse, user-facing status — see DATA_MODEL.md Phase 3
 * Additions and ADR-0008 for why it's kept distinct from the internal
 * ResearchRun.status job log.
 */

const TRANSITIONS: Record<AccountResearchStatus, AccountResearchStatus[]> = {
  queued: ['identifying', 'failed'],
  identifying: ['researching', 'needs_review', 'failed'],
  researching: ['processing', 'failed'],
  processing: ['ready', 'limited_data', 'failed'],
  ready: ['refreshing'],
  limited_data: ['refreshing'],
  needs_review: ['identifying', 'refreshing'],
  failed: ['queued'],
  refreshing: ['ready', 'limited_data', 'failed'],
};

export function canTransition(from: AccountResearchStatus, to: AccountResearchStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextPossibleStatuses(from: AccountResearchStatus): AccountResearchStatus[] {
  return TRANSITIONS[from];
}

/**
 * READY, LIMITED_DATA, and NEEDS_REVIEW are all states a rep can open
 * an account and get *some* value from — product spec §46's "partial
 * success" and §71's "low-data company is acceptable" both mean the
 * account isn't blocked just because research didn't fully succeed.
 * NEEDS_REVIEW additionally surfaces the identity-match warning.
 */
const USABLE_STATUSES: ReadonlySet<AccountResearchStatus> = new Set(['ready', 'limited_data', 'needs_review']);

export function isUsable(status: AccountResearchStatus): boolean {
  return USABLE_STATUSES.has(status);
}

const ACTIVE_STATUSES: ReadonlySet<AccountResearchStatus> = new Set([
  'queued',
  'identifying',
  'researching',
  'processing',
  'refreshing',
]);

/** Still in the pipeline — used for the "17 ready, 36 processing, 147 queued" progress summary (product spec §5). */
export function isActivelyProcessing(status: AccountResearchStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export interface ResearchProgressSummary {
  ready: number;
  processing: number;
  queued: number;
  failed: number;
  needsReview: number;
  total: number;
}

/** Product spec §5's "17 ready / 36 processing / 147 queued / 0 failed" summary, computed from real per-account statuses. */
export function summarizeResearchProgress(statuses: AccountResearchStatus[]): ResearchProgressSummary {
  return {
    ready: statuses.filter((s) => s === 'ready' || s === 'limited_data').length,
    processing: statuses.filter((s) => s === 'researching' || s === 'processing' || s === 'refreshing').length,
    queued: statuses.filter((s) => s === 'queued' || s === 'identifying').length,
    failed: statuses.filter((s) => s === 'failed').length,
    needsReview: statuses.filter((s) => s === 'needs_review').length,
    total: statuses.length,
  };
}
