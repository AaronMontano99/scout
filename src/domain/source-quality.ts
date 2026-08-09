/**
 * Source quality and conflict resolution — see docs/SOURCE_MODEL.md
 * and product spec §10, §36, §54-55. Tier 1 = strongest (first-party
 * internal), tier 5 = weakest (lower-confidence web data). Internal,
 * not shown to users as a number (product spec §55) — surfaces only
 * as which claim wins a conflict and as KNOWN/INFERRED/SUGGESTED
 * certainty on the resulting KnowledgeItem/ResearchFinding.
 */
import type { SourceTier } from '@/types/product';

export const SOURCE_TIER_LABEL: Record<SourceTier, string> = {
  1: 'First-party internal',
  2: 'Official company source',
  3: 'High-quality external source',
  4: 'Professional public information',
  5: 'Lower-confidence web data',
};

/**
 * Only tiers this good or better are eligible to represent "current
 * truth" in a conflict — see resolveConflict. A tier-5 directory
 * listing should never override a tier-1/2 source just by being newer
 * (product spec §10 and §55's "never allow a weak directory to
 * override high-quality evidence casually").
 */
const ELIGIBLE_FOR_CURRENT_MAX_TIER: SourceTier = 3;

export interface EvidenceCandidate {
  id: string;
  tier: SourceTier;
  /** When the underlying fact/event actually happened, if known — falls back to retrievedAt if absent. */
  eventDate: string | null;
  retrievedAt: string;
}

export interface ConflictResolution<T extends EvidenceCandidate> {
  current: T;
  historical: T[];
}

/**
 * Resolves competing evidence about the same fact (e.g. two claims
 * about who holds a role) — product spec §36's CFO example. Among
 * evidence good enough to trust (tier ≤ 3), the most recent wins as
 * "current"; everything else becomes "historical," never deleted (see
 * DATA_MODEL.md's KnowledgeItem supersession model — this function
 * decides *which* item that supersession logic should treat as
 * current, it doesn't perform the write itself).
 */
export function resolveConflict<T extends EvidenceCandidate>(candidates: T[]): ConflictResolution<T> {
  if (candidates.length === 0) {
    throw new Error('resolveConflict requires at least one candidate');
  }

  const eligible = candidates.filter((c) => c.tier <= ELIGIBLE_FOR_CURRENT_MAX_TIER);
  // If nothing clears the trust bar, fall back to the best tier
  // available rather than refusing to answer — product spec §16:
  // "progress over perfection," don't withhold usable research.
  const pool = eligible.length > 0 ? eligible : candidates;

  const sorted = [...pool].sort((a, b) => {
    const dateA = a.eventDate ?? a.retrievedAt;
    const dateB = b.eventDate ?? b.retrievedAt;
    if (dateA !== dateB) return dateB.localeCompare(dateA); // most recent first
    return a.tier - b.tier; // tie-break: stronger tier first
  });

  const current = sorted[0]!;
  const historical = candidates.filter((c) => c.id !== current.id);
  return { current, historical };
}

/**
 * Deduplicates the same underlying event reported by multiple sources
 * (product spec §54 — "the same news event may appear across 10
 * websites"). Groups by contentHash, keeps the strongest-tier source
 * as the representative for each group.
 */
export function deduplicateByContentHash<T extends { contentHash: string | null; tier: SourceTier }>(
  items: T[]
): T[] {
  const byHash = new Map<string, T>();
  const withoutHash: T[] = [];

  for (const item of items) {
    if (!item.contentHash) {
      withoutHash.push(item);
      continue;
    }
    const existing = byHash.get(item.contentHash);
    if (!existing || item.tier < existing.tier) {
      byHash.set(item.contentHash, item);
    }
  }

  return [...byHash.values(), ...withoutHash];
}
