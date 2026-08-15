import Link from 'next/link';
import { getTodayRows, listAccounts, getTargetLists, getFunnel } from '@/data';
import { StatTile, formatRate } from '@/components/stat-tile';
import { EmptyState } from '@/components/states';
import { FirstRun } from '@/components/first-run';
import { TodayList } from '@/components/today-list';

// Today — "who should I contact today, why, and what do we already
// know" (docs/PRODUCT_CONSTITUTION.md's core questions), aggregated
// across every active Target List. See docs/LOCAL_MODE.md — real data
// only, no fabricated priority scores.

export default function TodayPage() {
  const hasAnyAccounts = listAccounts().length > 0;
  if (!hasAnyAccounts) {
    return <FirstRun />;
  }

  const lists = getTargetLists();
  if (lists.length === 0) {
    return (
      <EmptyState
        title="No Target Lists yet"
        body="You have accounts, but nothing organized into a Target List yet. Create one to start working accounts from Today."
        ctaLabel="Create a List"
        ctaHref="/app/lists/new"
      />
    );
  }

  const rows = getTodayRows(50);
  const funnel = getFunnel();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Today</h1>
        <p className="mt-1 text-sm text-body">Accounts worth working today, across all active lists.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Calls Attempted" value={String(funnel.callsAttempted)} />
        <StatTile label="Meetings Booked" value={String(funnel.meetingsBooked)} />
        <StatTile label="Selling Situations" value={String(funnel.sellingSituationsCreated)} />
        <StatTile
          label="Call → Meeting Rate"
          value={formatRate(funnel.callToMeetingRate).value}
          denominatorLabel={formatRate(funnel.callToMeetingRate).denominatorLabel}
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No accounts to work"
          body="Every account on your active lists has been skipped, or your lists are empty. Add accounts to a list to see them here."
          ctaLabel="Open Lists"
          ctaHref="/app/lists"
        />
      ) : (
        <section>
          <TodayList rows={rows} />
        </section>
      )}

      <section className="flex items-center justify-between text-xs text-muted">
        <span>{lists.length} active lists</span>
        <Link href="/app/analytics" className="text-text-link hover:underline">
          View full analytics →
        </Link>
      </section>
    </div>
  );
}
