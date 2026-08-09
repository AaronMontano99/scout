import Link from 'next/link';
import { getTargetLists, getTargetListOverview, getFunnel } from '@/demo';
import { StatTile, formatRate } from '@/components/stat-tile';

// "Pick up where you left off" home experience — product spec §104.
// Not a dashboard full of charts; the job is getting the rep back into
// productive prospecting immediately.

export default function DemoHomePage() {
  const lists = getTargetLists();
  const overviews = lists.map((l) => getTargetListOverview(l.id)!).filter(Boolean);
  const mostRecentlyWorked = [...overviews].sort((a, b) =>
    (b.list.lastWorkedAt ?? '').localeCompare(a.list.lastWorkedAt ?? '')
  )[0];
  const funnel = getFunnel();

  return (
    <div className="flex flex-col gap-8">
      {mostRecentlyWorked && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Pick Up Where You Left Off
          </h2>
          <Link
            href={`/demo/lists/${mostRecentlyWorked.list.id}`}
            className="block rounded-lg border border-hairline-strong bg-surface-card p-5 hover:bg-canvas-soft"
          >
            <div className="text-lg font-semibold text-ink">{mostRecentlyWorked.list.name}</div>
            <div className="mt-1 text-sm text-body">
              {mostRecentlyWorked.progress.worked} / {mostRecentlyWorked.progress.total} worked
              {mostRecentlyWorked.list.lastWorkedAt && (
                <> · last worked {new Date(mostRecentlyWorked.list.lastWorkedAt).toLocaleDateString()}</>
              )}
            </div>
            <div className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
              Continue
            </div>
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Active Lists</h2>
        <div className="flex flex-col gap-2">
          {overviews.map(({ list, progress }) => (
            <Link
              key={list.id}
              href={`/demo/lists/${list.id}`}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface-card px-4 py-3 hover:bg-canvas-soft"
            >
              <div>
                <div className="text-sm font-medium text-ink">{list.name}</div>
                <div className="text-xs text-muted">
                  {progress.worked} / {progress.total} worked · {progress.pinnedCount} pinned
                </div>
              </div>
              <span className="text-xs text-text-link">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent Results</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Calls Attempted" value={String(funnel.callsAttempted)} />
          <StatTile label="Meetings Booked" value={String(funnel.meetingsBooked)} />
          <StatTile label="Selling Situations" value={String(funnel.sellingSituationsCreated)} />
          <StatTile
            label="Call → Meeting Rate"
            value={formatRate(funnel.callToMeetingRate).value}
            denominatorLabel={formatRate(funnel.callToMeetingRate).denominatorLabel}
          />
        </div>
      </section>
    </div>
  );
}
