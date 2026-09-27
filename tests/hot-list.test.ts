import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { actionFlag, addBusinessDays, sortHotList, type HotListEntry } from '@/domain/hot-list';
import type { HotListUpdate } from '@/ai/sdr/schemas';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-hotlist-test-'));
process.env.SCOUT_DB_PATH = path.join(tmpDir, 'scout.db');
const data = await import('@/data/accounts');
const sdr = await import('@/data/sdr');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('hot list domain', () => {
  it('flags by next-touch date', () => {
    expect(actionFlag('2026-09-25', '2026-09-26')).toBe('ACT NOW');
    expect(actionFlag('2026-09-26', '2026-09-26')).toBe('ACT NOW');
    expect(actionFlag('2026-09-28', '2026-09-26')).toBe('DUE');
    expect(actionFlag('2026-10-02', '2026-09-26')).toBe('UPCOMING');
    expect(actionFlag('2026-10-20', '2026-09-26')).toBe('LATER');
    expect(actionFlag(null, '2026-09-26')).toBe('SET DATE');
  });

  it('adds business days, skipping weekends', () => {
    expect(addBusinessDays('2026-09-25', 1)).toBe('2026-09-28'); // Fri → Mon
    expect(addBusinessDays('2026-09-28', 3)).toBe('2026-10-01');
  });

  it('sorts what needs attention first: flag, then priority, then stage', () => {
    const base = { accountName: '', contact: '', whyQualified: '', lastInteraction: '', learned: '', hypothesis: '', nextQuestion: '', nextAction: 'call', angle: '', meetingHypothesis: '', closeReason: '', lastTouchAt: null, addedAt: '', updatedAt: '' } as const;
    const e = (id: string, priority: HotListEntry['priority'], stage: HotListEntry['stage'], date: string | null): HotListEntry => ({ ...base, accountId: id, priority, stage, nextTouchDate: date });
    const sorted = sortHotList(
      [e('later-high', 'HIGH', 'warm', '2026-11-01'), e('now-low', 'LOW', 'new_qi', '2026-09-20'), e('now-high-ready', 'HIGH', 'meeting_ask_ready', '2026-09-26'), e('now-high-dev', 'HIGH', 'developing', '2026-09-26')],
      '2026-09-26'
    );
    expect(sorted.map((x) => x.accountId)).toEqual(['now-high-ready', 'now-high-dev', 'now-low', 'later-high']);
  });
});

function update(overrides: Partial<HotListUpdate>): HotListUpdate {
  return {
    decision: 'qualify_in',
    reason: 'Referred to the owner',
    priority: 'HIGH',
    stage: 'developing',
    contact: 'Sam Ortiz, Ops Manager',
    whyQualified: 'Front desk routed to the ops manager who owns the MSP relationship',
    lastInteraction: '9/26 call: Nina said IT is outsourced to an outside MSP via Fremont',
    learned: 'IT outsourced, run from Fremont; Sam Ortiz owns vendor relationships',
    hypothesis: 'Branch may have slow response from a centralized MSP',
    nextQuestion: 'How is an outside MSP response time for the Springfield branch?',
    nextAction: 'email',
    nextTouchDate: '2026-09-29',
    angle: 'Managed IT',
    meetingHypothesis: '15 min comparing branch IT support today',
    ...overrides,
  };
}

describe('hot list data', () => {
  it('qualifies in, updates, and takes an account off when the meeting is booked', () => {
    const a = data.createAccount({ name: 'Bayline Supply' });
    expect(sdr.applyHotListUpdate(a.id, update({ decision: 'not_qualified' }))).toBe('unchanged');
    expect(sdr.getHotListEntry(a.id)).toBeNull();

    expect(sdr.applyHotListUpdate(a.id, update({}))).toBe('added');
    expect(sdr.getHotListEntry(a.id)).toMatchObject({ priority: 'HIGH', stage: 'developing', nextTouchDate: '2026-09-29', accountName: 'Bayline Supply' });

    expect(sdr.applyHotListUpdate(a.id, update({ decision: 'update', stage: 'meeting_ask_ready', priority: 'MEDIUM' }))).toBe('updated');
    expect(sdr.getHotListEntry(a.id)?.stage).toBe('meeting_ask_ready');

    expect(sdr.applyHotListUpdate(a.id, update({ decision: 'meeting_booked' }))).toBe('removed');
    expect(sdr.getHotListEntry(a.id)?.stage).toBe('meeting_booked');
  });

  it('never lets a qualify_in land as booked/closed, and closes with a reason', () => {
    const a = data.createAccount({ name: 'Northgate Fabrication' });
    sdr.applyHotListUpdate(a.id, update({ stage: 'closed' }));
    expect(sdr.getHotListEntry(a.id)?.stage).toBe('developing');
    sdr.applyHotListUpdate(a.id, update({ decision: 'close', reason: 'Centralized, no local authority' }));
    expect(sdr.getHotListEntry(a.id)).toMatchObject({ stage: 'closed', closeReason: 'Centralized, no local authority' });
  });

  it('rolls the next touch forward after a quick touch on a due account only', () => {
    const a = data.createAccount({ name: 'Due Co' });
    sdr.applyHotListUpdate(a.id, update({ nextTouchDate: '2026-09-25' }));
    expect(sdr.recordHotListTouch(a.id, 'email sent: "Dave, quick question"', 3, new Date(2026, 8, 25))).toBe(true);
    expect(sdr.getHotListEntry(a.id)).toMatchObject({ nextTouchDate: '2026-09-30', lastInteraction: '9/25 email sent: "Dave, quick question"' });

    // Not due yet: interaction recorded, date left alone.
    sdr.recordHotListTouch(a.id, 'call: left VM', 2, new Date(2026, 8, 26));
    expect(sdr.getHotListEntry(a.id)?.nextTouchDate).toBe('2026-09-30');

    const off = data.createAccount({ name: 'Not On List' });
    expect(sdr.recordHotListTouch(off.id, 'call: no answer', 2)).toBe(false);
  });

  it('manual edits update only the given fields', () => {
    const a = data.createAccount({ name: 'Edit Co' });
    sdr.applyHotListUpdate(a.id, update({}));
    sdr.upsertHotList(a.id, { priority: 'LOW', nextTouchDate: null });
    expect(sdr.getHotListEntry(a.id)).toMatchObject({ priority: 'LOW', nextTouchDate: null, contact: 'Sam Ortiz, Ops Manager' });
  });
});
