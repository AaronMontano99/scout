import { describe, expect, it } from 'vitest';
import { calculateListProgress, toPriorityLabel, rankSuggestedCalls, explainSuggestion } from '@/domain/target-lists';
import type { Account, AccountScore, TargetListItem } from '@/types/product';

function item(overrides: Partial<TargetListItem>): TargetListItem {
  return {
    id: overrides.id ?? 'item-1',
    targetListId: 'list-1',
    accountId: overrides.accountId ?? 'acc-1',
    status: overrides.status ?? 'not_started',
    pinned: overrides.pinned ?? false,
    workedAt: null,
    addedAt: '2026-08-01T00:00:00Z',
  };
}

describe('calculateListProgress', () => {
  it('never resets — worked/skipped counts reflect exactly what is passed in', () => {
    const items = [
      item({ id: '1', status: 'worked' }),
      item({ id: '2', status: 'worked' }),
      item({ id: '3', status: 'skipped' }),
      item({ id: '4', status: 'not_started' }),
      item({ id: '5', status: 'in_progress', pinned: true }),
    ];
    const progress = calculateListProgress(items);
    expect(progress.total).toBe(5);
    expect(progress.worked).toBe(2);
    expect(progress.skipped).toBe(1);
    expect(progress.inProgress).toBe(1);
    expect(progress.remaining).toBe(2); // total - worked - skipped
    expect(progress.pinnedCount).toBe(1);
  });

  it('handles an empty list', () => {
    expect(calculateListProgress([])).toEqual({
      total: 0,
      worked: 0,
      skipped: 0,
      inProgress: 0,
      remaining: 0,
      pinnedCount: 0,
    });
  });
});

function score(totalScore: number, dataConfidenceRatio = 1): AccountScore {
  return {
    id: 's1',
    accountId: 'acc-1',
    totalScore,
    computedAt: '2026-08-01T00:00:00Z',
    components: [
      { componentType: 'data_confidence', points: dataConfidenceRatio * 5, maxPoints: 5, evidenceRefs: [] },
    ],
  };
}

describe('toPriorityLabel', () => {
  it('never returns a raw number — only fixed labels', () => {
    expect(toPriorityLabel(undefined)).toBe('limited_data');
    expect(toPriorityLabel(score(80))).toBe('strong_context');
    expect(toPriorityLabel(score(50))).toBe('useful_context');
    expect(toPriorityLabel(score(20))).toBe('limited_data');
  });

  it('low data confidence overrides an otherwise-high score', () => {
    expect(toPriorityLabel(score(90, 0.2))).toBe('lower_confidence');
  });
});

function account(id: string): Account {
  return {
    id,
    organizationId: 'org-1',
    name: `Account ${id}`,
    normalizedName: `account ${id}`,
    primaryDomain: null,
    industry: null,
    employeeCountRange: null,
    address: null,
    territoryId: null,
    ownerMembershipId: null,
    relationshipStatus: 'prospect',
    status: 'active',
    researchStatus: 'ready',
    identityStatus: 'confirmed',
    identityConfirmedAt: '2026-08-01T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}

describe('rankSuggestedCalls', () => {
  it('pinned accounts always sort first regardless of score', () => {
    const accounts = [account('a'), account('b')];
    const items = [
      item({ id: '1', accountId: 'a', pinned: false }),
      item({ id: '2', accountId: 'b', pinned: true }),
    ];
    const scores = new Map([
      ['a', score(95)],
      ['b', score(10)],
    ]);
    const ranked = rankSuggestedCalls(accounts, items, scores);
    expect(ranked[0]?.account.id).toBe('b');
    expect(ranked[0]?.pinned).toBe(true);
  });

  it('excludes already-worked and skipped accounts', () => {
    const accounts = [account('a'), account('b')];
    const items = [
      item({ id: '1', accountId: 'a', status: 'worked' }),
      item({ id: '2', accountId: 'b', status: 'not_started' }),
    ];
    const ranked = rankSuggestedCalls(accounts, items, new Map());
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.account.id).toBe('b');
  });

  it('respects the limit', () => {
    const accounts = Array.from({ length: 10 }, (_, i) => account(`a${i}`));
    const items = accounts.map((a, i) => item({ id: `item-${i}`, accountId: a.id }));
    const ranked = rankSuggestedCalls(accounts, items, new Map(), 3);
    expect(ranked).toHaveLength(3);
  });

  it('every entry carries explainable reasons, never a bare score', () => {
    const accounts = [account('a')];
    const items = [item({ id: '1', accountId: 'a' })];
    const richScore: AccountScore = {
      id: 's1',
      accountId: 'a',
      totalScore: 84,
      computedAt: '2026-08-01T00:00:00Z',
      components: [
        { componentType: 'historical_context', points: 14, maxPoints: 15, evidenceRefs: [] },
        { componentType: 'signal_strength', points: 18, maxPoints: 20, evidenceRefs: [] },
      ],
    };
    const ranked = rankSuggestedCalls(accounts, items, new Map([['a', richScore]]));
    expect(ranked[0]?.reasons).toContain('Strong internal history');
    expect(ranked[0]?.reasons).toContain('Recent meaningful signal');
  });
});

describe('explainSuggestion — product spec §106, no fake scores', () => {
  it('pinned accounts always get a reason even with no score data at all', () => {
    expect(explainSuggestion(undefined, true)).toEqual(['Pinned by you']);
  });

  it('unpinned accounts with no score data get no reasons rather than a fabricated one', () => {
    expect(explainSuggestion(undefined, false)).toEqual([]);
  });

  it('only strong-contributing components (>=60% of max) become reasons — weak ones are omitted', () => {
    const weakScore: AccountScore = {
      id: 's1',
      accountId: 'a',
      totalScore: 20,
      computedAt: '2026-08-01T00:00:00Z',
      components: [{ componentType: 'timing', points: 2, maxPoints: 20, evidenceRefs: [] }],
    };
    expect(explainSuggestion(weakScore, false)).toEqual([]);
  });

  it('data_confidence never becomes a "why suggested" reason — it explains trust, not relevance', () => {
    const score: AccountScore = {
      id: 's1',
      accountId: 'a',
      totalScore: 50,
      computedAt: '2026-08-01T00:00:00Z',
      components: [{ componentType: 'data_confidence', points: 5, maxPoints: 5, evidenceRefs: [] }],
    };
    expect(explainSuggestion(score, false)).toEqual([]);
  });

  it('never returns more than 3 reasons', () => {
    const score: AccountScore = {
      id: 's1',
      accountId: 'a',
      totalScore: 90,
      computedAt: '2026-08-01T00:00:00Z',
      components: [
        { componentType: 'icp_fit', points: 18, maxPoints: 20, evidenceRefs: [] },
        { componentType: 'timing', points: 18, maxPoints: 20, evidenceRefs: [] },
        { componentType: 'relationship', points: 18, maxPoints: 20, evidenceRefs: [] },
        { componentType: 'signal_strength', points: 18, maxPoints: 20, evidenceRefs: [] },
        { componentType: 'historical_context', points: 14, maxPoints: 15, evidenceRefs: [] },
        { componentType: 'strategic_priority', points: 5, maxPoints: 5, evidenceRefs: [] },
      ],
    };
    expect(explainSuggestion(score, false).length).toBeLessThanOrEqual(3);
  });
});
