import Link from 'next/link';
import { getActivitiesBetween } from '@/data/sdr';
import { formatDaySummary, summarizeDay } from '@/domain/day-summary';
import { PageHeader } from '@/components/ui/page-header';
import { MicroLabel } from '@/components/ui/micro-label';
import { StatTile } from '@/components/ui/stat-tile';
import { ActivityList } from '@/components/sdr/activity-list';
import { CopyButton } from '@/components/sdr/shared';

// "Day finished" — only confirmed, logged activity, split into
// prospecting/reactivation vs admin, ready to paste into a tracker.

export const dynamic = 'force-dynamic';

function localDayBounds(dateParam?: string): { start: Date; end: Date } {
  const base = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(`${dateParam}T00:00:00`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start, end };
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function DayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const { start, end } = localDayBounds(date);
  const activities = getActivitiesBetween(start.toISOString(), end.toISOString());
  const summary = summarizeDay(activities);
  const label = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const tracker = formatDaySummary(summary, label);
  const p = summary.prospecting;
  const isToday = ymd(start) === ymd(new Date());
  const prev = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <PageHeader title={isToday ? 'Day finished' : label} subtitle="Only what you logged. Nothing estimated." />
        <div className="flex items-center gap-3 text-[12.5px]">
          <Link href={`/day?date=${ymd(prev)}`} className="text-text-link hover:underline">
            ← {prev.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Link>
          {!isToday && (
            <Link href={`/day?date=${ymd(next)}`} className="text-text-link hover:underline">
              {next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <StatTile label="Dials" value={String(p.calls.dials)} />
        <StatTile label="Connects" value={String(p.calls.connects)} />
        <StatTile label="DM Convos" value={String(p.calls.dmConversations)} />
        <StatTile label="Meeting Asks" value={String(p.calls.meetingAsks + p.walkIns.meetingAsks + p.linkedin.meetingAsks)} />
        <StatTile label="Emails Sent" value={String(p.emails.sent)} />
        <StatTile
          label="Meetings Booked"
          value={String(p.calls.meetingsBooked + p.emails.meetingsBooked + p.walkIns.meetingsBooked + p.linkedin.meetingsBooked)}
        />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[14px] border border-hairline-strong bg-surface-card p-6">
          <div className="flex items-center justify-between">
            <MicroLabel>Tracker-ready</MicroLabel>
            <CopyButton text={tracker} label="Copy for tracker" />
          </div>
          <pre className="mt-3 font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap text-ink">{tracker}</pre>
        </div>
        <ActivityList activities={[...activities].reverse()} showAccount title={`Logged ${isToday ? 'today' : 'this day'}`} />
      </div>
    </div>
  );
}
