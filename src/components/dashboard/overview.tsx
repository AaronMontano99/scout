import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { DEMO } from '@/demo/mode';
import { getAllActivities, getHotList } from '@/data/sdr';
import { getSettings } from '@/data/settings';
import { getTasks } from '@/data/tasks';
import { STAGE_LABEL, actionFlag, isActive, sortHotList, ymd, type HotStage } from '@/domain/hot-list';
import { daysSinceLastTouch, rate, startOfWeek, totals, weeklySeries } from '@/domain/metrics';
import { buildSchedule, nextUp } from '@/domain/schedule';
import { ActivityChart, Funnel, Legend } from './charts';
import { Panel, Stat, pct } from './stat';
import { NextUpList } from './next-up';
import { RecentActivity } from './recent-activity';
import { LogButton } from './log-button';

const BOARD: HotStage[] = ['new_qi', 'developing', 'warm', 'meeting_ask_ready'];

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  return hour < 17 ? 'Good afternoon' : 'Good evening';
}

export function OverviewPage() {
  const now = new Date();
  const today = ymd(now);
  const settings = getSettings();
  const activities = getAllActivities();
  const hot = getHotList();
  const items = buildSchedule(getTasks(), hot);

  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7);
  const inRange = (from: Date, to: Date) => activities.filter((a) => new Date(a.occurredAt) >= from && new Date(a.occurredAt) < to);
  const thisWeek = totals(inRange(weekStart, new Date(now.getTime() + 1)));
  const lastWeek = totals(inRange(lastWeekStart, weekStart));

  const chartStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7 * 7);
  const series = weeklySeries(activities, chartStart, new Date(now.getTime() + 1));
  const last8 = totals(inRange(chartStart, new Date(now.getTime() + 1)));
  const trend = (pick: (p: (typeof series)[number]) => number) => series.map(pick);

  const active = sortHotList(hot.filter((e) => isActive(e.stage)), today);
  const dueNow = active.filter((e) => actionFlag(e.nextTouchDate, today) === 'ACT NOW').length;
  const openToday = items.filter((i) => !i.done && i.date <= today).length;
  const gap = daysSinceLastTouch(activities, now);
  const connect = rate(thisWeek.connects, thisWeek.dials);

  const headline =
    gap === null
      ? 'Nothing logged yet. Log your first touch and this page starts filling in.'
      : thisWeek.touches > 0
        ? `${thisWeek.touches} touches this week, ${thisWeek.meetings} ${thisWeek.meetings === 1 ? 'meeting' : 'meetings'} booked.`
        : `Nothing logged this week yet. Your last touch was ${gap === 0 ? 'today' : gap === 1 ? 'yesterday' : `${gap} days ago`}.`;

  return (
    <div className="rise flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[14px] text-body">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-1 text-[32px] leading-[1.1] font-medium tracking-[-0.015em] sm:text-[40px]">
            {DEMO ? (
              "Here's what Ferret tracks."
            ) : (
              <>
                {greeting(now.getHours())}
                {settings.ownerName ? `, ${settings.ownerName}` : ''}.
              </>
            )}
          </h1>
          <p className="mt-2 text-[15px] text-body">{headline}</p>
        </div>
        <LogButton />
      </div>

      <section aria-label="This week" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Touches this week" value={String(thisWeek.touches)} detail={`vs ${lastWeek.touches} last week`} trend={trend((p) => p.touches)} />
        <Stat label="Dials this week" value={String(thisWeek.dials)} detail={`vs ${lastWeek.dials} last week`} trend={trend((p) => p.dials)} goal={{ done: thisWeek.dials, target: settings.weeklyDialGoal }} />
        <Stat label="Connect rate" value={pct(connect)} detail={connect.denominator ? `${connect.numerator} of ${connect.denominator} dials` : 'No dials this week'} trend={trend((p) => p.connects)} />
        <Stat label="Meetings booked" value={String(thisWeek.meetings)} detail={`vs ${lastWeek.meetings} last week`} trend={trend((p) => p.meetings)} goal={{ done: thisWeek.meetings, target: settings.weeklyMeetingGoal }} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Your work, last 8 weeks"
          action={
            <Link href="/reports" aria-label="Open reports" className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
              <ArrowUpRight size={16} />
            </Link>
          }
        >
          <ActivityChart data={series} />
          <Legend />
        </Panel>

        <Panel
          title="Do this next"
          action={
            <span className={`rounded-full px-2.5 py-1 text-[13px] font-medium ${openToday ? 'bg-bad-soft text-bad' : 'bg-good-soft text-good'}`}>
              {openToday ? `${openToday} open` : 'All clear'}
            </span>
          }
        >
          <NextUpList items={nextUp(items, today, 5)} today={today} />
          {openToday > 5 && (
            <Link href="/schedule" className="text-[13.5px] text-text-link hover:underline">
              See all {openToday} on the Schedule
            </Link>
          )}
        </Panel>
      </div>

      <section aria-labelledby="hot-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="hot-heading" className="text-[18px] font-medium">
            Hot accounts
          </h2>
          <Link href="/hot-list" className="text-[13.5px] text-text-link hover:underline">
            Open the board
          </Link>
        </div>
        {active.length === 0 ? (
          <p className="glass p-5 text-[14px] text-body">Nothing on the Hot List yet. Accounts land here when a call or email qualifies them in.</p>
        ) : (
          <div className="scroll-x -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {active.slice(0, 4).map((e) => (
              <Link key={e.accountId} href={`/accounts/${e.accountId}`} data-stage={e.stage} className="stage-card flex w-[260px] shrink-0 snap-start flex-col gap-1 p-4 sm:w-auto">
                <span className="text-[13px] text-body">{e.nextTouchDate ? `Next touch ${new Date(`${e.nextTouchDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No date set'}</span>
                <span className="font-head text-[18px] leading-snug font-medium">{e.accountName}</span>
                <span className="truncate text-[13.5px] text-body">{e.contact || 'No contact yet'}</span>
                <span className="mt-2 flex items-center gap-2 text-[13px] text-ink">
                  <span className="stage-dot" />
                  {STAGE_LABEL[e.stage]}
                  <span className="ml-auto text-body">{e.priority}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Call funnel, last 8 weeks">
          <Funnel
            steps={[
              { label: 'Dials', value: last8.dials, rate: null },
              { label: 'Connects', value: last8.connects, rate: rate(last8.connects, last8.dials) },
              { label: 'DM talks', value: last8.dmConversations, rate: rate(last8.dmConversations, last8.connects) },
              { label: 'Meetings', value: last8.meetingsByChannel.calls, rate: rate(last8.meetingsByChannel.calls, last8.dmConversations) },
            ]}
          />
        </Panel>
        <Panel title="Hot List by stage">
          <ul className="flex flex-col gap-3">
            {BOARD.map((s) => {
              const count = active.filter((e) => e.stage === s).length;
              return (
                <li key={s} data-stage={s} className="flex items-center gap-3 text-[14px]">
                  <span className="stage-dot" />
                  <span className="flex-1 text-body">{STAGE_LABEL[s]}</span>
                  <span className="font-medium">{count}</span>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-hairline pt-3 text-[13.5px] text-body">
            {dueNow} of {active.length} are due or overdue.
          </p>
        </Panel>
        <Panel title="Recent activity">
          <RecentActivity activities={activities.slice(0, 4)} />
        </Panel>
      </div>
    </div>
  );
}
