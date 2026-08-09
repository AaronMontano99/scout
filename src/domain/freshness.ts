/**
 * Research freshness — see docs/RESEARCH_FRESHNESS.md, product spec
 * §19-20, §66, §69. Different categories of information decay at
 * different rates; persistent memory (internal knowledge, rep
 * progress, corrections) never auto-expires. Windows are configurable
 * data, never hardcoded deep in business logic — see FRESHNESS_WINDOWS_DAYS.
 */

export type FreshnessCategory =
  | 'company_description' // slow-changing — what the company does, where it operates
  | 'leadership' // medium-changing — who holds which role
  | 'news' // fast-changing — recent developments
  | 'contact_employment' // people change jobs — decays independently of any specific fact
  | 'internal_knowledge'; // persistent — never auto-expires, only superseded by a new entry

/**
 * Days after which information in this category is considered stale
 * enough to warrant a refresh. `null` means never auto-stale — see
 * `internal_knowledge` (product spec §19: "persistent unless updated").
 */
export const FRESHNESS_WINDOWS_DAYS: Record<FreshnessCategory, number | null> = {
  company_description: 90,
  leadership: 45,
  news: 14,
  contact_employment: 60,
  internal_knowledge: null,
};

export function isStale(category: FreshnessCategory, lastCheckedAt: string | null, now: Date = new Date()): boolean {
  const windowDays = FRESHNESS_WINDOWS_DAYS[category];
  if (windowDays === null) return false; // internal knowledge never auto-expires
  if (!lastCheckedAt) return true; // never checked at all — treat as stale, not as fresh-by-default
  const ageMs = now.getTime() - new Date(lastCheckedAt).getTime();
  return ageMs > windowDays * 24 * 60 * 60 * 1000;
}

/**
 * The subtle, glance-level text FreshnessChip renders (see
 * src/components/priority.tsx and DESIGN.md's freshness-chip spec —
 * plain text, never a callout). Never says "stale" bluntly for recent
 * data; only flags staleness once the window has actually passed.
 */
export function describeFreshness(
  category: FreshnessCategory,
  lastCheckedAt: string | null,
  now: Date = new Date()
): string {
  if (!lastCheckedAt) return 'not yet checked';

  const ageDays = Math.floor((now.getTime() - new Date(lastCheckedAt).getTime()) / (24 * 60 * 60 * 1000));
  const stale = isStale(category, lastCheckedAt, now);

  if (ageDays <= 0) return stale ? 'checked today — potentially stale' : 'checked today';
  if (ageDays === 1) return stale ? 'updated yesterday — potentially stale' : 'updated yesterday';
  return stale ? `updated ${ageDays} days ago — potentially stale` : `updated ${ageDays} days ago`;
}

/**
 * Smart refresh (product spec §20): given a category's staleness,
 * decide whether a cached value can be reused as-is, or needs a real
 * refresh. Persistent categories are always reusable — this is what
 * keeps a Monday research pass intact when the rep returns Friday.
 */
export function canReuseCache(category: FreshnessCategory, lastCheckedAt: string | null, now: Date = new Date()): boolean {
  return !isStale(category, lastCheckedAt, now);
}
