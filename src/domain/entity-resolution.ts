/**
 * Entity resolution helpers — see docs/ENTITY_RESOLUTION.md,
 * docs/DATA_MODEL.md §Entity resolution, and ADR-0005/ADR-0008.
 * Deliberately conservative: only a deterministic domain or external-ID
 * match, or a normalized-name match corroborated by a second
 * independent signal, ever auto-applies. Everything else returns a
 * 'review' verdict and must create an AccountMatchCandidate row, never
 * a silent merge.
 *
 * Phase 3 extends this (not replaces it — see ADR-0008) with: richer
 * corroborating signals (address, external IDs), a mapping to the
 * user-facing AccountIdentityStatus, and persistent-identity helpers
 * so a confirmed match is never re-solved from scratch.
 */
import type { AccountIdentityStatus } from '@/types/product';

const LEGAL_SUFFIXES = [
  'inc', 'incorporated', 'llc', 'l.l.c', 'ltd', 'limited', 'corp',
  'corporation', 'co', 'company', 'llp', 'lp', 'pc', 'pllc',
];

export function normalizeCompanyName(raw: string): string {
  let name = raw.toLowerCase().trim();
  name = name.replace(/[.,]/g, '');
  const words = name.split(/\s+/).filter((w) => !LEGAL_SUFFIXES.includes(w));
  return words.join(' ').trim();
}

export function normalizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

export interface ResolutionCandidate {
  accountId: string;
  name: string;
  domain?: string;
  /** CRM/enrichment-provider external ID already associated with this account, if any. */
  externalId?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface ResolutionInput {
  name: string;
  domain?: string;
  /** An external ID a CRM/enrichment provider already resolved for this record — the strongest possible signal, on par with domain. */
  externalId?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export type MatchMethod =
  | 'deterministic_external_id'
  | 'deterministic_domain'
  | 'normalized_name'
  | 'fuzzy'
  | 'user_confirmed'
  | 'none';
export type MatchVerdict = 'auto_apply' | 'review' | 'no_match';

export interface MatchResult {
  method: MatchMethod;
  verdict: MatchVerdict;
  accountId: string | null;
  confidence: number;
}

/**
 * Resolves a raw company record against existing accounts. Signal
 * priority: external ID > domain > normalized name + corroborating
 * signal (domain OR matching city+state+postal) > fuzzy name > none.
 * Only the first two ever `auto_apply` on their own.
 */
export function resolveAccount(raw: ResolutionInput, existing: ResolutionCandidate[]): MatchResult {
  if (raw.externalId) {
    const idMatch = existing.find((c) => c.externalId && c.externalId === raw.externalId);
    if (idMatch) {
      return { method: 'deterministic_external_id', verdict: 'auto_apply', accountId: idMatch.accountId, confidence: 1 };
    }
  }

  const rawDomain = raw.domain ? normalizeDomain(raw.domain) : undefined;
  const rawName = normalizeCompanyName(raw.name);

  if (rawDomain) {
    const domainMatch = existing.find((c) => c.domain && normalizeDomain(c.domain) === rawDomain);
    if (domainMatch) {
      return { method: 'deterministic_domain', verdict: 'auto_apply', accountId: domainMatch.accountId, confidence: 1 };
    }
  }

  const nameMatches = existing.filter((c) => normalizeCompanyName(c.name) === rawName);
  if (nameMatches.length === 1) {
    const candidate = nameMatches[0]!;
    const domainConflicts = Boolean(rawDomain && candidate.domain && normalizeDomain(candidate.domain) !== rawDomain);
    const domainCorroborates = Boolean(rawDomain) && !candidate.domain;
    const addressCorroborates = addressMatches(raw, candidate);

    // Name matches AND either no domain conflict exists (candidate has
    // no domain on file to disagree, or a matching address instead) —
    // a name match against a candidate with a *different* domain is a
    // conflict, not corroboration, regardless of address.
    if (!domainConflicts && (domainCorroborates || addressCorroborates)) {
      return { method: 'normalized_name', verdict: 'auto_apply', accountId: candidate.accountId, confidence: 0.9 };
    }
    if (domainConflicts) {
      return { method: 'normalized_name', verdict: 'review', accountId: candidate.accountId, confidence: 0.4 };
    }
    // Name matches, no second signal either way — review, never auto-apply.
    return { method: 'normalized_name', verdict: 'review', accountId: candidate.accountId, confidence: 0.6 };
  }

  if (nameMatches.length > 1) {
    // Multiple accounts share a normalized name — always ambiguous,
    // always review, regardless of any other signal.
    return { method: 'fuzzy', verdict: 'review', accountId: null, confidence: 0.3 };
  }

  // Threshold of 0.5 (not the intuitively "safer"-looking 0.8): Jaccard
  // similarity on short company-name token sets punishes even a single
  // differing word heavily (e.g. "Johnson Electric Service" vs "Johnson
  // Electrical Service" is 0.6, not 0.9) — an 0.8 bar was effectively
  // unreachable for realistic near-duplicates and made this branch dead
  // code. 0.5 still requires real overlap; it never auto-applies
  // regardless (verdict is always 'review' below), so a looser bar here
  // costs nothing in safety, only in whether a real near-duplicate gets
  // flagged for human review at all.
  const fuzzyMatch = existing.find((c) => fuzzyNameSimilarity(rawName, normalizeCompanyName(c.name)) > 0.5);
  if (fuzzyMatch) {
    return { method: 'fuzzy', verdict: 'review', accountId: fuzzyMatch.accountId, confidence: 0.5 };
  }

  return { method: 'none', verdict: 'no_match', accountId: null, confidence: 0 };
}

function addressMatches(raw: ResolutionInput, candidate: ResolutionCandidate): boolean {
  if (!raw.postalCode || !candidate.postalCode) return false;
  return (
    raw.postalCode.trim() === candidate.postalCode.trim() &&
    (!raw.city || !candidate.city || raw.city.toLowerCase() === candidate.city.toLowerCase())
  );
}

/** Simple token-overlap similarity — good enough to flag review candidates, never to auto-merge. */
function fuzzyNameSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// --- User confirmation & persistent identity (product spec §8-9, §37) ---

/**
 * A user explicitly confirming/correcting a match always wins — see
 * product spec §37 and AI_ARCHITECTURE.md's trust rules. This never
 * runs through the signal-scoring logic above; a human decision is not
 * something an algorithm re-evaluates.
 */
export function confirmIdentityByUser(accountId: string): MatchResult {
  return { method: 'user_confirmed', verdict: 'auto_apply', accountId, confidence: 1 };
}

/**
 * Once an identity is confirmed (by a user or a deterministic signal),
 * Scout should never re-solve it from scratch on a routine refresh —
 * product spec §9. Only an explicit re-check (e.g. the domain itself
 * changed) should bypass this.
 */
export function shouldSkipResolution(identityStatus: AccountIdentityStatus): boolean {
  return identityStatus === 'confirmed';
}

/**
 * Maps an internal MatchResult to the coarser, user-facing status
 * stored on Account.identityStatus (DATA_MODEL.md Phase 3 Additions).
 * Deliberately fewer states than MatchMethod — the UI shows "Likely
 * Match," never "normalized_name, confidence 0.9."
 */
export function toIdentityStatus(result: MatchResult): AccountIdentityStatus {
  if (result.verdict === 'no_match') return 'unconfirmed';
  if (result.method === 'user_confirmed') return 'confirmed';
  if (result.verdict === 'auto_apply' && result.confidence >= 1) return 'confirmed';
  if (result.verdict === 'auto_apply') return 'likely_match';
  if (result.confidence >= 0.5) return 'lower_confidence';
  return 'review_recommended';
}
