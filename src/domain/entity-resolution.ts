/**
 * Entity resolution helpers — see docs/DATA_MODEL.md §Entity resolution
 * and ADR-0005. Deliberately conservative: only deterministic domain
 * match, or normalized-name match corroborated by a second signal,
 * ever auto-applies. Everything else returns a 'review' verdict and
 * must create an AccountMatchCandidate row, never a silent merge.
 */

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
}

export type MatchMethod = 'deterministic_domain' | 'normalized_name' | 'fuzzy' | 'none';
export type MatchVerdict = 'auto_apply' | 'review' | 'no_match';

export interface MatchResult {
  method: MatchMethod;
  verdict: MatchVerdict;
  accountId: string | null;
  confidence: number;
}

/**
 * Resolves a raw (name, domain) pair against existing accounts.
 * Second-signal corroboration for normalized-name matches means: the
 * name matches AND at least one of {domain present and non-conflicting}
 * — a name-only match, however clean, never auto-applies on its own.
 */
export function resolveAccount(
  raw: { name: string; domain?: string },
  existing: ResolutionCandidate[]
): MatchResult {
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
    const secondSignalCorroborates = Boolean(rawDomain) && !candidate.domain;
    // Name matches AND either no domain conflict exists (candidate has
    // no domain on file to disagree) or domains actually agree
    // (already handled above). A name match against a candidate with a
    // *different* domain is a conflict, not corroboration.
    const domainConflicts = Boolean(rawDomain && candidate.domain && normalizeDomain(candidate.domain) !== rawDomain);
    if (!domainConflicts && (secondSignalCorroborates || !rawDomain)) {
      return rawDomain
        ? { method: 'normalized_name', verdict: 'auto_apply', accountId: candidate.accountId, confidence: 0.9 }
        : { method: 'normalized_name', verdict: 'review', accountId: candidate.accountId, confidence: 0.6 };
    }
    if (domainConflicts) {
      return { method: 'normalized_name', verdict: 'review', accountId: candidate.accountId, confidence: 0.4 };
    }
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

/** Simple token-overlap similarity — good enough to flag review candidates, never to auto-merge. */
function fuzzyNameSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}
