import { describe, expect, it } from 'vitest';
import { formatDaySummary, readFunnel, summarizeDay, type ActivityRecord } from '@/domain/day-summary';

let n = 0;
function activity(overrides: Partial<ActivityRecord>): ActivityRecord {
  n += 1;
  return {
    id: `a${n}`,
    accountId: `acct${n}`,
    accountName: `Company ${n}`,
    channel: 'call',
    category: 'prospecting',
    outcome: 'no_answer',
    contactName: null,
    rawNotes: null,
    crmNotes: [],
    connected: false,
    decisionMaker: false,
    relevant: false,
    meetingAsked: false,
    meetingBooked: false,
    occurredAt: '2026-09-26T17:00:00.000Z',
    ...overrides,
  };
}

describe('summarizeDay', () => {
  it('counts only logged activity and splits prospecting from admin', () => {
    const summary = summarizeDay([
      activity({ outcome: 'no_answer' }),
      activity({ outcome: 'voicemail' }),
      activity({ outcome: 'decision_maker', connected: true, decisionMaker: true, relevant: true, meetingAsked: true }),
      activity({ outcome: 'meeting_booked', connected: true, decisionMaker: true, relevant: true, meetingAsked: true, meetingBooked: true }),
      activity({ channel: 'email', outcome: 'email_sent', meetingAsked: true }),
      activity({ channel: 'email', outcome: 'email_reply', connected: true, relevant: true }),
      activity({ channel: 'call', category: 'admin', outcome: 'connected', connected: true }),
    ]);

    expect(summary.prospecting.calls).toEqual({
      dials: 4,
      connects: 2,
      voicemails: 1,
      dmConversations: 2,
      relevantConversations: 2,
      meetingAsks: 2,
      meetingsBooked: 1,
    });
    expect(summary.prospecting.emails).toEqual({ sent: 1, replies: 1, relevantReplies: 1, meetingAsks: 1, meetingsBooked: 0 });
    expect(summary.admin.calls.dials).toBe(1);
    expect(summary.admin.total).toBe(1);
    expect(summary.accountsTouched).toHaveLength(7);
  });

  it('formats a tracker-ready block that leaves out empty channels', () => {
    const text = formatDaySummary(summarizeDay([activity({ outcome: 'voicemail' })]), 'Fri, Sep 26, 2026');
    expect(text).toContain('DAY FINISHED: Fri, Sep 26, 2026');
    expect(text).toContain('Calls: 1 dials');
    expect(text).toContain('1 VMs left');
    expect(text).not.toContain('Emails:');
    expect(text).not.toContain('ADMIN');
  });

  it('says so plainly when nothing was logged', () => {
    const text = formatDaySummary(summarizeDay([]), 'Sat, Sep 27, 2026');
    expect(text).toContain('No prospecting activity logged.');
  });
});

describe('readFunnel (playbook diagnostics)', () => {
  const base = { dials: 20, connects: 10, voicemails: 5, dmConversations: 5, relevantConversations: 4, meetingAsks: 4, meetingsBooked: 1 };

  it('refuses to diagnose a thin sample', () => {
    expect(readFunnel({ ...base, dials: 4, connects: 1 })[0]).toMatch(/Not enough connects/);
    expect(readFunnel({ ...base, dials: 0, connects: 0 })).toEqual([]);
  });

  it('flags a targeting issue when few connects are DMs', () => {
    expect(readFunnel({ ...base, dmConversations: 1, relevantConversations: 1, meetingAsks: 1 }).join(' ')).toMatch(/targeting\/contact/);
  });

  it('flags an opening/hypothesis issue when DMs are not relevant', () => {
    expect(readFunnel({ ...base, relevantConversations: 1, meetingAsks: 1 }).join(' ')).toMatch(/opening and hypothesis/);
  });

  it('flags over-discovery when relevant talks get no ask', () => {
    expect(readFunnel({ ...base, meetingAsks: 1 }).join(' ')).toMatch(/over-discovery/);
  });

  it('flags meeting value when asks do not book', () => {
    expect(readFunnel({ ...base, meetingAsks: 5, meetingsBooked: 0 }).join(' ')).toMatch(/meeting value/);
  });

  it('reports no leak when the funnel is healthy', () => {
    expect(readFunnel(base)).toEqual(['No obvious leak in the call funnel today.']);
  });
});

describe('no-pickup rule', () => {
  it('retries until the third no-pickup, then moves to the walk-in list', async () => {
    const { noPickupNextMove } = await import('@/domain/day-summary');
    const base = { company: 'Harbor Community Services', contact: 'Rosa Delgado', phone: '408-555-0177', cardIfNoAnswer: null, angle: 'Print/office tech review' };
    const first = noPickupNextMove({ ...base, outcome: 'voicemail', noPickupCount: 1 });
    expect(first.walkIn).toBe(false);
    expect(first.trackerLine).toBe('Harbor Community Services — Rosa Delgado — 408-555-0177 — No pickup, VM left — Retry — Print/office tech review');

    const third = noPickupNextMove({ ...base, outcome: 'no_answer', noPickupCount: 3 });
    expect(third.walkIn).toBe(true);
    expect(third.nextMove).toMatch(/walk-in/);
    expect(third.trackerLine).toBe('Harbor Community Services — Rosa Delgado — 408-555-0177 — No pickup — Move to walk-in list — Print/office tech review');
  });
});
