import Link from 'next/link';
import { getActivityCounts, getFunnel, getRoleReach, getTargetLists, getListPerformance, getRecentOutcomes } from '@/data';
import { StatTile, formatRate } from '@/components/stat-tile';
import { ProspectingFunnelView } from '@/components/funnel';
import { OutcomeBadge } from '@/components/badges';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';

// Real-data analytics — same layout as src/app/demo/analytics/page.tsx.
// Every number here is computed from analytics_events rows you actually
// generated. See docs/LOCAL_MODE.md.

function ReachBar({ label, rate }: { label: string; rate: ReturnType<typeof getRoleReach>['decisionMakerReachRate'] }) {
  const formatted = formatRate(rate);
  const pct = rate.rate === null ? 0 : Math.max(rate.rate * 100, rate.numerator > 0 ? 3 : 0);
  return (
    <div className="grid grid-cols-[150px_74px_40px_1fr] items-center gap-2.5">
      <span className="text-[13px] text-ink">{label}</span>
      <span className="text-[12px] text-muted">{formatted.denominatorLabel}</span>
      <span className="text-right font-mono text-[12px] text-ink">{formatted.value}</span>
      <span className="h-1.5 rounded-full bg-surface-strong">
        <span className="block h-1.5 rounded-full bg-[#2F80FF]" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

type Range = '7d' | '30d' | 'all';

const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

function sinceFor(range: Range): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range: Range = rangeParam === '7d' || rangeParam === '30d' ? rangeParam : 'all';
  const since = sinceFor(range);

  const activity = getActivityCounts(since);
  const funnel = getFunnel(since);
  const reach = getRoleReach(since);
  const lists = getTargetLists();
  const recentOutcomes = getRecentOutcomes(10, since);

  const funnelTiles = [
    { label: 'Calls Attempted', value: funnel.callsAttempted, denom: null },
    { label: 'Conversations', value: funnel.conversations, denom: formatRate(funnel.pickupRate).denominatorLabel },
    { label: 'Meetings Booked', value: funnel.meetingsBooked, denom: formatRate(funnel.callToMeetingRate).denominatorLabel },
    { label: 'Selling Situations', value: funnel.sellingSituationsCreated, denom: formatRate(funnel.meetingToSellingSituationRate).denominatorLabel },
    { label: 'Opportunities', value: funnel.opportunitiesCreated, denom: formatRate(funnel.sellingSituationToOpportunityRate).denominatorLabel },
    { label: 'New Contacts', value: activity.contact_added, denom: null },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics"
        subtitle="Concrete prospecting metrics tied to real calls, conversations, and meetings."
        actions={
          <>
            <div className="flex items-center overflow-hidden rounded-md border border-hairline-strong">
              {RANGES.map((r) => (
                <Link
                  key={r.id}
                  href={`/app/analytics?range=${r.id}`}
                  className={`px-3.5 py-[9px] text-[12.5px] font-medium whitespace-nowrap ${
                    range === r.id ? 'bg-ink text-canvas' : 'bg-canvas text-body hover:bg-canvas-soft'
                  }`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
            <a
              href="/app/settings/export"
              className="rounded-md border border-hairline-strong bg-canvas px-4 py-[9px] text-[13.5px] font-medium whitespace-nowrap text-ink hover:bg-canvas-soft"
            >
              Export
            </a>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {funnelTiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={String(t.value)} denominatorLabel={t.denom ?? undefined} />
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Panel className="min-w-0 flex-1 p-[18px_20px]">
          <MicroLabel>Prospecting Funnel</MicroLabel>
          <div className="mt-4">
            <ProspectingFunnelView funnel={funnel} />
          </div>
          <p className="mt-4 text-xs leading-[1.5] text-[#B8BDC4]">
            Bar width is the real count against the largest stage. A rate with no attempts renders as an em dash, never 0%.
          </p>
        </Panel>

        <Panel className="w-full p-[18px_20px] lg:w-[460px]">
          <MicroLabel>Who Am I Actually Reaching</MicroLabel>
          <p className="mt-1.5 text-[12.5px] text-body">Every rate below uses total logged call outcomes as its denominator.</p>
          <div className="mt-4 flex flex-col gap-3">
            <ReachBar label="Decision-Maker" rate={reach.decisionMakerReachRate} />
            <ReachBar label="Champion / Influencer" rate={reach.championOrInfluencerReachRate} />
            <ReachBar label="Gatekeeper" rate={reach.gatekeeperRate} />
            <ReachBar label="No Answer" rate={reach.noAnswerRate} />
          </div>
          <p className="mt-4 border-t border-hairline pt-3.5 text-xs leading-[1.5] text-[#B8BDC4]">
            Zero is a real number here. It means those calls happened and did not reach that role.
          </p>
        </Panel>
      </div>

      {lists.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-hairline px-5 py-[15px]">
            <MicroLabel>List Performance</MicroLabel>
          </div>
          <div className="grid grid-cols-[1fr_100px_70px_100px_90px] gap-3 border-b border-hairline bg-canvas-soft px-5 py-2">
            <MicroLabel>List</MicroLabel>
            <MicroLabel>Worked</MicroLabel>
            <MicroLabel>Calls</MicroLabel>
            <MicroLabel>Meetings</MicroLabel>
            <MicroLabel>Selling</MicroLabel>
          </div>
          {lists.map((list) => {
            const perf = getListPerformance(list.id);
            if (!perf) return null;
            return (
              <Link
                key={list.id}
                href={`/app/lists/${list.id}`}
                className="grid grid-cols-[1fr_100px_70px_100px_90px] items-center gap-3 border-b border-hairline px-5 py-2.5 last:border-b-0 hover:bg-canvas-soft"
              >
                <span className="truncate text-[13.5px] font-medium text-ink">{list.name}</span>
                <span className="text-[12.5px] text-body">
                  {perf.progress.worked}/{perf.progress.total}
                </span>
                <span className="text-[12.5px] text-body">{perf.calls}</span>
                <span className="text-[12.5px] text-body">{perf.meetings}</span>
                <span className="text-[12.5px] text-body">{perf.sellingSituations}</span>
              </Link>
            );
          })}
        </Panel>
      )}

      <div>
        <div className="mb-2">
          <MicroLabel>Recent Outcomes</MicroLabel>
        </div>
        {recentOutcomes.length === 0 ? (
          <p className="text-sm text-muted">No calls logged yet — outcomes you log will show up here.</p>
        ) : (
          <Panel className="overflow-hidden">
            {recentOutcomes.map(({ outcome, accountName }) => (
              <Link
                key={outcome.id}
                href={`/app/accounts/${outcome.accountId}`}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-2">
                  <OutcomeBadge outcome={outcome.outcomeType} />
                  <span className="text-sm text-ink">{accountName}</span>
                </div>
                <span className="text-xs text-muted">{new Date(outcome.occurredAt).toLocaleString()}</span>
              </Link>
            ))}
          </Panel>
        )}
      </div>

      {activity.call_attempted === 0 && (
        <Panel className="px-4 py-6 text-center text-sm text-muted">
          No activity logged yet.{' '}
          <Link href="/app" className="text-text-link hover:underline">
            Open Today
          </Link>{' '}
          to start working accounts.
        </Panel>
      )}
    </div>
  );
}
