import Link from 'next/link';
import { getActivityCounts, getFunnel, getRoleReach, getTargetLists, getListPerformance } from '@/demo';
import { StatTile, formatRate } from '@/components/stat-tile';
import { ProspectingFunnelView } from '@/components/funnel';
import { Card } from '@/components/ui/card';

// Signature experience #5 (product spec §79) — "the proof the company
// should continue paying." Rep-facing view: what did I do, who am I
// reaching, what did it produce. No fake AI scores, no surveillance
// metrics (time-in-app, keystrokes) — see PROSPECTING_ANALYTICS.md.

export default function AnalyticsPage() {
  const activity = getActivityCounts();
  const funnel = getFunnel();
  const reach = getRoleReach();
  const lists = getTargetLists();

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

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Target List Performance</h2>
        <div className="flex flex-col gap-2">
          {lists.map((list) => {
            const perf = getListPerformance(list.id);
            if (!perf) return null;
            return (
              <Link
                key={list.id}
                href={`/demo/lists/${list.id}`}
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
    </div>
  );
}
