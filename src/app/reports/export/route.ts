import { getAllActivities } from '@/data/sdr';
import { toCsv } from '@/domain/csv';
import { parseRange, rangeWindow } from '@/domain/metrics';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const range = parseRange(new URL(request.url).searchParams.get('range') ?? undefined);
  const { start, end } = rangeWindow(range, new Date());
  const yes = (v: boolean) => (v ? 'Yes' : '');
  const rows = getAllActivities()
    .filter((a) => new Date(a.occurredAt) >= start && new Date(a.occurredAt) < end)
    .map((a) => [a.occurredAt.slice(0, 16).replace('T', ' '), a.accountName, a.channel, a.category, a.outcome ?? '', a.contactName ?? '', yes(a.connected), yes(a.decisionMaker), yes(a.relevant), yes(a.meetingAsked), yes(a.meetingBooked)]);
  const csv = toCsv(['When (UTC)', 'Account', 'Channel', 'Category', 'Outcome', 'Contact', 'Connected', 'Decision maker', 'Relevant', 'Meeting asked', 'Meeting booked'], rows);
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="scout-activity-${range}.csv"` } });
}
