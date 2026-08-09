import type { Account, AccountScore, TargetListItem, PriorityLabel } from '@/types/product';

/**
 * Target List domain logic — see docs/TARGET_LISTS.md and ADR-0006.
 * Pure functions, no I/O, unit-testable without a database. This is
 * the highest-risk logic in the product spec's own words ("list
 * memory is permanent" / "progress must not reset") so it gets tests
 * first — see tests/target-lists.test.ts.
 */

export interface TargetListProgress {
  total: number;
  worked: number;
  remaining: number;
  pinnedCount: number;
  inProgress: number;
  skipped: number;
}

export function calculateListProgress(items: TargetListItem[]): TargetListProgress {
  const worked = items.filter((i) => i.status === 'worked').length;
  const skipped = items.filter((i) => i.status === 'skipped').length;
  const inProgress = items.filter((i) => i.status === 'in_progress').length;
  return {
    total: items.length,
    worked,
    skipped,
    inProgress,
    remaining: items.length - worked - skipped,
    pinnedCount: items.filter((i) => i.pinned).length,
  };
}

/**
 * Maps a raw AccountScore to a human-readable priority label. Product
 * spec §35 explicitly forbids fake-precise numeric scores in the UI
 * ("no mandatory 87/100") — this function is the single place that
 * translates a score into the label a rep actually sees, so the raw
 * number never leaks into a UI component by accident.
 */
export function toPriorityLabel(score: AccountScore | undefined): PriorityLabel {
  if (!score) return 'limited_data';
  const dataConfidence = score.components.find((c) => c.componentType === 'data_confidence');
  const lowConfidence = dataConfidence && dataConfidence.points / dataConfidence.maxPoints < 0.4;
  if (lowConfidence) return 'lower_confidence';
  if (score.totalScore >= 75) return 'strong_context';
  if (score.totalScore >= 45) return 'useful_context';
  return 'limited_data';
}

export interface SuggestedCallEntry {
  account: Account;
  item: TargetListItem;
  priorityLabel: PriorityLabel;
  pinned: boolean;
}

/**
 * Orders a Target List's accounts for the "Suggested Calls" view.
 * Product spec §36: pins always win regardless of automatic ordering
 * — the salesperson stays in control, Scout is an assistant. Already-
 * worked/skipped accounts are excluded (§37 — Scout doesn't push the
 * rep to re-call something they already handled unless they choose to).
 */
export function rankSuggestedCalls(
  accounts: Account[],
  items: TargetListItem[],
  scores: Map<string, AccountScore>,
  limit = 50
): SuggestedCallEntry[] {
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const workable = items.filter((i) => i.status === 'not_started' || i.status === 'in_progress');

  const entries: SuggestedCallEntry[] = workable
    .map((item) => {
      const account = accountsById.get(item.accountId);
      if (!account) return null;
      return {
        account,
        item,
        priorityLabel: toPriorityLabel(scores.get(item.accountId)),
        pinned: item.pinned,
      };
    })
    .filter((e): e is SuggestedCallEntry => e !== null);

  const labelWeight: Record<PriorityLabel, number> = {
    strong_context: 3,
    useful_context: 2,
    limited_data: 1,
    lower_confidence: 0,
  };

  entries.sort((a, b) => {
    // Pinned accounts always sort first — user control beats any automatic ordering.
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return labelWeight[b.priorityLabel] - labelWeight[a.priorityLabel];
  });

  return entries.slice(0, limit);
}
