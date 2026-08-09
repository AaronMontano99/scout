import { describe, expect, it } from 'vitest';
import {
  canTransition,
  nextPossibleStatuses,
  isUsable,
  isActivelyProcessing,
  summarizeResearchProgress,
} from '@/domain/research-status';
import type { AccountResearchStatus } from '@/types/product';

const ALL_STATUSES: AccountResearchStatus[] = [
  'queued', 'identifying', 'researching', 'processing',
  'ready', 'limited_data', 'needs_review', 'failed', 'refreshing',
];

describe('research status transitions', () => {
  it('every status has at least one valid next state (no dead ends)', () => {
    for (const status of ALL_STATUSES) {
      expect(nextPossibleStatuses(status).length).toBeGreaterThan(0);
    }
  });

  it('the normal happy path is a valid chain', () => {
    expect(canTransition('queued', 'identifying')).toBe(true);
    expect(canTransition('identifying', 'researching')).toBe(true);
    expect(canTransition('researching', 'processing')).toBe(true);
    expect(canTransition('processing', 'ready')).toBe(true);
  });

  it('a stuck job can always be retried from failed back to queued', () => {
    expect(canTransition('failed', 'queued')).toBe(true);
  });

  it('ready/limited_data can only move forward via refreshing, never skip back to queued', () => {
    expect(canTransition('ready', 'refreshing')).toBe(true);
    expect(canTransition('ready', 'queued')).toBe(false);
    expect(canTransition('limited_data', 'queued')).toBe(false);
  });

  it('rejects an invalid jump straight from queued to ready', () => {
    expect(canTransition('queued', 'ready')).toBe(false);
  });

  it('needs_review can loop back to identifying once a user resolves the match', () => {
    expect(canTransition('needs_review', 'identifying')).toBe(true);
  });
});

describe('isUsable', () => {
  it('ready, limited_data, and needs_review are all usable — partial success is not blocked', () => {
    expect(isUsable('ready')).toBe(true);
    expect(isUsable('limited_data')).toBe(true);
    expect(isUsable('needs_review')).toBe(true);
  });

  it('queued/processing/failed are not usable yet', () => {
    expect(isUsable('queued')).toBe(false);
    expect(isUsable('processing')).toBe(false);
    expect(isUsable('failed')).toBe(false);
  });
});

describe('isActivelyProcessing', () => {
  it('queued, identifying, researching, processing, refreshing all count as active', () => {
    for (const s of ['queued', 'identifying', 'researching', 'processing', 'refreshing'] as const) {
      expect(isActivelyProcessing(s)).toBe(true);
    }
  });

  it('ready/limited_data/needs_review/failed are not "actively processing"', () => {
    for (const s of ['ready', 'limited_data', 'needs_review', 'failed'] as const) {
      expect(isActivelyProcessing(s)).toBe(false);
    }
  });
});

describe('summarizeResearchProgress — product spec §5', () => {
  it('produces the "17 ready / processing / queued / failed" summary from real statuses', () => {
    const statuses: AccountResearchStatus[] = [
      ...Array(17).fill('ready'),
      ...Array(20).fill('processing'),
      ...Array(16).fill('researching'),
      ...Array(147).fill('queued'),
      ...Array(0).fill('failed'),
    ];
    const summary = summarizeResearchProgress(statuses);
    expect(summary.ready).toBe(17);
    expect(summary.processing).toBe(36);
    expect(summary.queued).toBe(147);
    expect(summary.failed).toBe(0);
    expect(summary.total).toBe(200);
  });
});
