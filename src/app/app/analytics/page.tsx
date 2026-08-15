import Link from 'next/link';
import { getActivityCounts, getFunnel, getRoleReach, getTargetLists, getListPerformance, getRecentOutcomes } from '@/data';
import { StatTile, formatRate } from '@/components/stat-tile';
import { ProspectingFunnelView } from '@/components/funnel';
import { Card } from '@/components/ui/card';
import { OutcomeBadge } from '@/components/badges';

// Real-data analytics — same layout as src/app/demo/analytics/page.tsx.
// Every number here is computed from analytics_events rows you actually
// generated; local mode has no event-logging UI yet, so these read as
// all-zero until that's built. See docs/LOCAL_MODE.md.

export default function AnalyticsPage() {
  const activity = getActivityCounts();
  const funnel = getFunnel();
  const reach = getRoleReach();
  const lists = getTargetLists();
  const recentOutcomes = getRecentOutcomes(10);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-body">
          What you did, who you reached, and what it produced — every rate below shows its real denominator.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">What Did I Do</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Calls Attempted" value={String(activity.call_attempted)} />
          <StatTile label="Conversations" value={String(activity.conversation)} />
          <StatTile label="Meetings Booked" value={String(activity.meeting_booked)} />
          <StatTile label="Selling Situations" value={String(activity.selling_situation_created)} />
          <StatTile label="Emails Drafted" value={String(activity.email_drafted)} />
          <StatTile label="Emails Sent" value={String(activity.email_sent)} />
          <StatTile label="CRM Notes Created" value={String(activity.crm_note_created)} />
          <StatTile label="New Contacts" value={String(activity.contact_added)} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Who Am I Reaching</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Decision-Maker Reach"
            value={formatRate(reach.decisionMakerReachRate).value}
            denominatorLabel={formatRate(reach.decisionMakerReachRate).denominatorLabel}
          />
          <StatTile
            label="Champion/Influencer Reach"
            value={formatRate(reach.championOrInfluencerReachRate).value}
            denominatorLabel={formatRate(reach.championOrInfluencerReachRate).denominatorLabel}
          />
          <StatTile
            label="Gatekeeper Rate"
            value={formatRate(reach.gatekeeperRate).value}
            denominatorLabel={formatRate(reach.gatekeeperRate).denominatorLabel}
          />
          <StatTile
            label="No-Answer Rate"
            value={formatRate(reach.noAnswerRate).value}
            denominatorLabel={formatRate(reach.noAnswerRate).denominatorLabel}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Prospecting Funnel</h2>
        <Card>
          <ProspectingFunnelView funnel={funnel} />
        </Card>
      </section>

      {lists.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Target List Performance</h2>
          <div className="flex flex-col gap-2">
            {lists.map((list) => {
              const perf = getListPerformance(list.id);
              if (!perf) return null;
              return (
                <Link
                  key={list.id}
                  href={`/app/lists/${list.id}`}
                  className="flex items-center justify-between rounded-lg border border-hairline-strong bg-surface-card px-4 py-3 hover:bg-canvas-soft"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">{perf.list.name}</div>
                    <div className="text-xs text-muted">
                      {perf.progress.worked} / {perf.progress.total} worked · {perf.calls} calls · {perf.meetings}{' '}
                      meetings · {perf.sellingSituations} selling situations
                    </div>
                  </div>
                  <span className="text-xs text-text-link">Open →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent Outcomes</h2>
        {recentOutcomes.length === 0 ? (
          <p className="text-sm text-muted">No calls logged yet — outcomes you log will show up here.</p>
        ) : (
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
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
          </div>
        )}
      </section>

      {activity.call_attempted === 0 && (
        <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-6 text-center text-sm text-muted">
          No activity logged yet.{' '}
          <Link href="/app" className="text-text-link hover:underline">
            Open Today
          </Link>{' '}
          to start working accounts.
        </div>
      )}
    </div>
  );
}
