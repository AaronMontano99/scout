import { describe, expect, it } from 'vitest';
import { callHeatmap, daysSinceLastTouch, rangeWindow, rate, startOfWeek, topAccounts, totals, weeklySeries } from '@/domain/metrics';
import { buildSchedule, formatTime, isOverdue, monthGrid, nextMonday, nextUp, weekOf, type Task } from '@/domain/schedule';
import { buildAlerts } from '@/domain/alerts';
import { outcomeFlags } from '@/domain/quick-log';
import { toCsv } from '@/domain/csv';
import { summarizeDay, type ActivityRecord } from '@/domain/day-summary';
import type { HotListEntry } from '@/domain/hot-list';
import type { EmailLogRow } from '@/domain/email-log';

function activity(over: Partial<ActivityRecord>): ActivityRecord {
  return {
    id: crypto.randomUUID(),
    accountId: 'a',
    accountName: 'Acme',
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
    occurredAt: new Date(2026, 9, 7, 10).toISOString(),
    ...over,
  };
}

function task(over: Partial<Task>): Task {
  return { id: 't', accountId: null, accountName: null, title: 'Task', kind: 'task', dueDate: '2026-11-02', dueTime: null, notes: '', doneAt: null, ...over };
}

function hot(over: Partial<HotListEntry>): HotListEntry {
  return {
    accountId: 'h',
    accountName: 'Hotco',
    priority: 'MEDIUM',
    stage: 'warm',
    contact: '',
    whyQualified: '',
    lastInteraction: '',
    learned: '',
    hypothesis: '',
    nextQuestion: 'Who owns it?',
    nextAction: 'call',
    nextTouchDate: '2026-11-02',
    angle: '',
    meetingHypothesis: '',
    closeReason: '',
    lastTouchAt: null,
    addedAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('metrics', () => {
  it('never turns an empty denominator into 0%', () => {
    expect(rate(0, 0).rate).toBeNull();
    expect(rate(1, 4).rate).toBe(0.25);
  });

  it('agrees with Day finished and leaves admin out', () => {
    const list = [
      activity({ outcome: 'decision_maker', connected: true, decisionMaker: true, relevant: true, meetingAsked: true, meetingBooked: true }),
      activity({ channel: 'email', outcome: 'email_sent', meetingAsked: true }),
      activity({ channel: 'walk_in', outcome: 'gatekeeper', connected: true }),
      activity({ category: 'admin' }),
    ];
    const t = totals(list);
    const day = summarizeDay(list).prospecting;
    expect(t.dials).toBe(day.calls.dials);
    expect(t.touches).toBe(3);
    expect(t.meetings).toBe(1);
    // An email's built-in ask is not a live meeting ask.
    expect(t.meetingAsks).toBe(1);
  });

  it('weeks start on Monday, and Sunday belongs to the week before', () => {
    expect(startOfWeek(new Date(2026, 10, 1)).getDate()).toBe(26);
    expect(startOfWeek(new Date(2026, 10, 2)).getDate()).toBe(2);
  });

  it('keeps empty weeks in the series so gaps stay visible', () => {
    const { start, end } = rangeWindow('4w', new Date(2026, 10, 1));
    const series = weeklySeries([activity({ occurredAt: new Date(2026, 9, 7, 10).toISOString() })], start, end);
    expect(series).toHaveLength(4);
    expect(series.map((p) => p.touches)).toEqual([1, 0, 0, 0]);
    expect(series[1]!.connectRate).toBeNull();
  });

  it('counts a call in the right heatmap cell', () => {
    const cells = callHeatmap([activity({ connected: true })]);
    const hit = cells.filter((c) => c.dials > 0);
    expect(hit).toEqual([{ day: 2, hour: 10, dials: 1, connects: 1 }]);
  });

  it('knows how long it has been, and when there is no history', () => {
    expect(daysSinceLastTouch([], new Date())).toBeNull();
    expect(daysSinceLastTouch([activity({ occurredAt: new Date(2026, 9, 7, 23).toISOString() })], new Date(2026, 9, 10, 1))).toBe(3);
  });

  it('ranks accounts by meetings, then touches', () => {
    const { start, end } = rangeWindow('4w', new Date(2026, 10, 1));
    const list = [activity({}), activity({}), activity({ accountId: 'b', accountName: 'Booked', meetingBooked: true })];
    expect(topAccounts(list, start, end).map((a) => a.accountId)).toEqual(['b', 'a']);
  });
});

describe('schedule', () => {
  it('merges tasks with active Hot List touches and skips closed rows', () => {
    const items = buildSchedule([task({})], [hot({}), hot({ accountId: 'c', stage: 'closed' }), hot({ accountId: 'd', nextTouchDate: null })]);
    expect(items.map((i) => i.id).sort()).toEqual(['task:t', 'touch:h']);
  });

  it('puts today’s meeting above a stale backlog', () => {
    const items = buildSchedule(
      [task({ id: 'm', kind: 'meeting', dueDate: '2026-11-02' }), task({ id: 'old', dueDate: '2026-09-01' })],
      [hot({ priority: 'HIGH', nextTouchDate: '2026-10-01' })]
    );
    expect(nextUp(items, '2026-11-02')[0]!.id).toBe('task:m');
  });

  it('never calls finished or future work overdue', () => {
    const items = buildSchedule([task({ dueDate: '2026-09-01', doneAt: 'x' }), task({ id: 'f', dueDate: '2026-12-01' })], []);
    expect(items.some((i) => isOverdue(i, '2026-11-02'))).toBe(false);
    expect(nextUp(items, '2026-11-02')).toHaveLength(0);
  });

  it('builds a six-week Monday-first month', () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(6);
    expect(grid[0]![0]).toBe('2026-10-26');
    expect(grid[0]![6]).toBe('2026-11-01');
    expect(weekOf('2026-11-01')[0]).toBe('2026-10-26');
  });

  it('moves to the next Monday from any day', () => {
    expect(nextMonday('2026-11-01')).toBe('2026-11-02');
    expect(nextMonday('2026-11-02')).toBe('2026-11-09');
    expect(nextMonday('2026-11-07')).toBe('2026-11-09');
  });

  it('formats times like a person would say them', () => {
    expect(formatTime('13:30')).toBe('1:30pm');
    expect(formatTime('09:00')).toBe('9am');
    expect(formatTime('00:15')).toBe('12:15am');
  });
});

describe('alerts', () => {
  const email = (over: Partial<EmailLogRow>): EmailLogRow => ({
    accountId: 'e',
    company: 'Mailco',
    contact: '',
    subject: '',
    lastSentAt: null,
    lastReplyAt: null,
    lastActivityAt: '',
    status: 'awaiting_reply',
    qualification: 'in',
    reason: '',
    nextStep: '',
    ...over,
  });

  it('flags overdue work and quiet threads, and stays silent otherwise', () => {
    const items = buildSchedule([task({ dueDate: '2026-10-01' })], []);
    const alerts = buildAlerts({ items, emailRows: [email({ lastSentAt: '2026-10-01T10:00:00Z' }), email({ accountId: 'f', lastSentAt: '2026-11-01T10:00:00Z' })], today: '2026-11-02' });
    expect(alerts.map((a) => a.id)).toEqual(['overdue:task:t', 'quiet:e']);
    expect(buildAlerts({ items: [], emailRows: [], today: '2026-11-02' })).toEqual([]);
  });

  it('rolls a long backlog up instead of listing it all', () => {
    const items = buildSchedule(Array.from({ length: 6 }, (_, i) => task({ id: String(i), dueDate: '2026-10-01' })), []);
    const alerts = buildAlerts({ items, emailRows: [], today: '2026-11-02' });
    expect(alerts).toHaveLength(4);
    expect(alerts.at(-1)!.title).toBe('3 more overdue');
  });
});

describe('quick log', () => {
  it('a booked meeting implies the whole funnel', () => {
    expect(outcomeFlags('meeting_booked')).toEqual({ connected: true, decisionMaker: true, relevant: true, meetingAsked: true, meetingBooked: true });
  });

  it('no pickup counts as a dial and nothing else', () => {
    expect(Object.values(outcomeFlags('no_answer')).some(Boolean)).toBe(false);
  });
});

describe('csv', () => {
  it('quotes what needs quoting and defuses spreadsheet formulas', () => {
    const csv = toCsv(['A'], [['x,y'], ['say "hi"'], ['=SUM(1)'], [5]]);
    expect(csv.split('\r\n')).toEqual(['A', '"x,y"', '"say ""hi"""', "'=SUM(1)", '5']);
  });
});
