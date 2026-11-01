/**
 * Dashboard numbers. Pure and built on the same counting as Day finished
 * (summarizeDay), so a week here always equals the sum of its days there.
 * Every number is a count of logged rows. Nothing is scored or estimated,
 * and a rate with nothing to divide by is null, never 0%.
 */
import { summarizeDay, type ActivityRecord, type BucketSummary } from './day-summary';

export interface Rate {
  numerator: number;
  denominator: number;
  rate: number | null;
}

export function rate(numerator: number, denominator: number): Rate {
  return { numerator, denominator, rate: denominator > 0 ? numerator / denominator : null };
}

export interface Totals {
  touches: number;
  dials: number;
  connects: number;
  voicemails: number;
  dmConversations: number;
  relevantConversations: number;
  /** Asks made live (calls, walk-ins, LinkedIn). Every email carries an ask, so emails are left out, matching Day finished. */
  meetingAsks: number;
  meetings: number;
  emailsSent: number;
  emailReplies: number;
  relevantReplies: number;
  walkIns: number;
  linkedin: number;
  meetingsByChannel: { calls: number; emails: number; walkIns: number; linkedin: number };
}

export function totalsFrom(b: BucketSummary): Totals {
  const meetingsByChannel = {
    calls: b.calls.meetingsBooked,
    emails: b.emails.meetingsBooked,
    walkIns: b.walkIns.meetingsBooked,
    linkedin: b.linkedin.meetingsBooked,
  };
  return {
    touches: b.total,
    dials: b.calls.dials,
    connects: b.calls.connects,
    voicemails: b.calls.voicemails,
    dmConversations: b.calls.dmConversations,
    relevantConversations: b.calls.relevantConversations,
    meetingAsks: b.calls.meetingAsks + b.walkIns.meetingAsks + b.linkedin.meetingAsks,
    meetings: meetingsByChannel.calls + meetingsByChannel.emails + meetingsByChannel.walkIns + meetingsByChannel.linkedin,
    emailsSent: b.emails.sent,
    emailReplies: b.emails.replies,
    relevantReplies: b.emails.relevantReplies,
    walkIns: b.walkIns.total,
    linkedin: b.linkedin.total,
    meetingsByChannel,
  };
}

export function totals(activities: ActivityRecord[]): Totals {
  return totalsFrom(summarizeDay(activities).prospecting);
}

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Monday of the week containing d, local time. */
export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return addDays(atMidnight(d), day === 0 ? -6 : 1 - day);
}

export type RangeKey = '4w' | '12w' | '26w' | '52w';

export const RANGES: { key: RangeKey; label: string; weeks: number }[] = [
  { key: '4w', label: '4W', weeks: 4 },
  { key: '12w', label: '12W', weeks: 12 },
  { key: '26w', label: '26W', weeks: 26 },
  { key: '52w', label: '52W', weeks: 52 },
];

export function parseRange(value: string | undefined): RangeKey {
  return RANGES.some((r) => r.key === value) ? (value as RangeKey) : '12w';
}

export interface RangeWindow {
  start: Date;
  /** Exclusive: the start of tomorrow. */
  end: Date;
  /** The same length of time just before start, for comparison. */
  previousStart: Date;
  weeks: number;
}

/** A range covers this week plus the whole weeks before it, so bars are never cut in half. */
export function rangeWindow(key: RangeKey, today: Date): RangeWindow {
  const weeks = RANGES.find((r) => r.key === key)?.weeks ?? 12;
  const start = addDays(startOfWeek(today), -7 * (weeks - 1));
  return { start, end: addDays(atMidnight(today), 1), previousStart: addDays(start, -7 * weeks), weeks };
}

export interface SeriesPoint {
  key: string;
  label: string;
  calls: number;
  emails: number;
  walkIns: number;
  linkedin: number;
  touches: number;
  dials: number;
  connects: number;
  meetings: number;
  connectRate: number | null;
}

function shortDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** One point per week from start through end, empty weeks included, because a gap in the work should show as a gap. */
export function weeklySeries(activities: ActivityRecord[], start: Date, end: Date): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (let weekStart = startOfWeek(start); weekStart < end; weekStart = addDays(weekStart, 7)) {
    const next = addDays(weekStart, 7);
    const inWeek = activities.filter((a) => {
      const t = new Date(a.occurredAt);
      return t >= weekStart && t < next;
    });
    const b = summarizeDay(inWeek).prospecting;
    const t = totalsFrom(b);
    points.push({
      key: shortDay(weekStart),
      label: shortDay(weekStart),
      calls: t.dials,
      emails: t.emailsSent + t.emailReplies,
      walkIns: t.walkIns,
      linkedin: t.linkedin,
      touches: t.touches,
      dials: t.dials,
      connects: t.connects,
      meetings: t.meetings,
      connectRate: rate(t.connects, t.dials).rate,
    });
  }
  return points;
}

export const HEAT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
export const HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export interface HeatCell {
  day: number;
  hour: number;
  dials: number;
  connects: number;
}

/** When dials get picked up, Monday to Friday, by local hour. Weekend and out-of-hours dials are left off. */
export function callHeatmap(activities: ActivityRecord[]): HeatCell[] {
  const cells = HEAT_DAYS.flatMap((_, day) => HEAT_HOURS.map((hour) => ({ day, hour, dials: 0, connects: 0 })));
  for (const a of activities) {
    if (a.channel !== 'call' || a.category === 'admin') continue;
    const t = new Date(a.occurredAt);
    const day = t.getDay() - 1;
    const cell = cells.find((c) => c.day === day && c.hour === t.getHours());
    if (!cell) continue;
    cell.dials += 1;
    if (a.connected) cell.connects += 1;
  }
  return cells;
}

/** Whole days since the latest prospecting touch, or null if there has never been one. */
export function daysSinceLastTouch(activities: ActivityRecord[], today: Date): number | null {
  const times = activities.filter((a) => a.category !== 'admin').map((a) => new Date(a.occurredAt).getTime());
  if (times.length === 0) return null;
  const last = atMidnight(new Date(Math.max(...times))).getTime();
  return Math.round((atMidnight(today).getTime() - last) / 86_400_000);
}

export interface AccountRollup {
  accountId: string;
  accountName: string;
  touches: number;
  conversations: number;
  meetings: number;
  lastTouchAt: string;
  /** Touches per week across the window, oldest first. */
  trend: number[];
}

/** Most-worked accounts in the window: where the time actually went. */
export function topAccounts(activities: ActivityRecord[], start: Date, end: Date, limit = 8): AccountRollup[] {
  const byAccount = new Map<string, ActivityRecord[]>();
  for (const a of activities) {
    if (!a.accountId || a.category === 'admin') continue;
    byAccount.set(a.accountId, [...(byAccount.get(a.accountId) ?? []), a]);
  }
  return [...byAccount.entries()]
    .map(([accountId, list]) => {
      const series = weeklySeries(list, start, end);
      const newest = list.reduce((x, y) => (x.occurredAt > y.occurredAt ? x : y));
      return {
        accountId,
        accountName: newest.accountName,
        touches: list.length,
        conversations: list.filter((a) => a.connected).length,
        meetings: list.filter((a) => a.meetingBooked).length,
        lastTouchAt: newest.occurredAt,
        trend: series.map((p) => p.touches),
      };
    })
    .sort((a, b) => b.meetings - a.meetings || b.touches - a.touches || b.lastTouchAt.localeCompare(a.lastTouchAt))
    .slice(0, limit);
}
