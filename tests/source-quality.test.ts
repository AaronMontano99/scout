import { describe, expect, it } from 'vitest';
import { resolveConflict, deduplicateByContentHash, type EvidenceCandidate } from '@/domain/source-quality';

describe('resolveConflict — product spec §36 CFO example', () => {
  it('a more recent tier-2 source outranks an older tier-1 source for a time-varying fact', () => {
    const candidates: EvidenceCandidate[] = [
      { id: 'crm-2022', tier: 1, eventDate: '2022-09-01', retrievedAt: '2022-09-01' },
      { id: 'website-2026', tier: 2, eventDate: '2026-07-01', retrievedAt: '2026-08-01' },
    ];
    const result = resolveConflict(candidates);
    expect(result.current.id).toBe('website-2026');
    expect(result.historical.map((h) => h.id)).toEqual(['crm-2022']);
  });

  it('never lets a weak tier-5 source override a stronger tier-1 source just for being newer', () => {
    const candidates: EvidenceCandidate[] = [
      { id: 'crm-2024', tier: 1, eventDate: '2024-01-01', retrievedAt: '2024-01-01' },
      { id: 'directory-2026', tier: 5, eventDate: '2026-08-01', retrievedAt: '2026-08-01' },
    ];
    const result = resolveConflict(candidates);
    expect(result.current.id).toBe('crm-2024');
  });

  it('falls back to the best available tier when nothing clears the trust bar (progress over perfection)', () => {
    const candidates: EvidenceCandidate[] = [
      { id: 'weak-old', tier: 5, eventDate: '2020-01-01', retrievedAt: '2020-01-01' },
      { id: 'weak-new', tier: 4, eventDate: '2026-01-01', retrievedAt: '2026-01-01' },
    ];
    const result = resolveConflict(candidates);
    expect(result.current.id).toBe('weak-new'); // stronger tier among the weak pool
  });

  it('never deletes historical evidence — losers are returned, not discarded', () => {
    const candidates: EvidenceCandidate[] = [
      { id: 'a', tier: 1, eventDate: '2020-01-01', retrievedAt: '2020-01-01' },
      { id: 'b', tier: 1, eventDate: '2026-01-01', retrievedAt: '2026-01-01' },
    ];
    const result = resolveConflict(candidates);
    expect(result.historical).toHaveLength(1);
    expect(result.historical[0]?.id).toBe('a');
  });

  it('throws on an empty candidate list rather than silently returning nothing', () => {
    expect(() => resolveConflict([])).toThrow();
  });
});

describe('deduplicateByContentHash — product spec §54', () => {
  it('collapses the same event reported by multiple sources into one representative', () => {
    const items = [
      { id: '1', contentHash: 'hash-a', tier: 3 as const },
      { id: '2', contentHash: 'hash-a', tier: 5 as const },
      { id: '3', contentHash: 'hash-a', tier: 2 as const },
      { id: '4', contentHash: 'hash-b', tier: 4 as const },
    ];
    const deduped = deduplicateByContentHash(items);
    expect(deduped).toHaveLength(2);
    expect(deduped.find((d) => d.contentHash === 'hash-a')?.id).toBe('3'); // strongest tier (2) wins
  });

  it('items without a content hash are never deduplicated against each other', () => {
    const items = [
      { id: '1', contentHash: null, tier: 3 as const },
      { id: '2', contentHash: null, tier: 3 as const },
    ];
    expect(deduplicateByContentHash(items)).toHaveLength(2);
  });
});
