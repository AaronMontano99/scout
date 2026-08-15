import { redirect } from 'next/navigation';
import { getTargetLists, getTargetListOverview } from '@/data';
import { EmptyState } from '@/components/states';

// Lists index — the prototype's Lists screen is a single two-pane view
// with a list picker on the left; here that lives at /app/lists/[id]
// so each list has its own shareable URL (see the master integration
// spec's "reuse existing routes" rule). /app/lists itself redirects to
// the most recently worked list.

export default function ListsIndexPage() {
  const lists = getTargetLists();

  if (lists.length === 0) {
    return (
      <EmptyState
        title="No Target Lists Yet"
        body="Create a Target List, then add the accounts you want to prospect to it."
        ctaLabel="Create Target List"
        ctaHref="/app/lists/new"
      />
    );
  }

  const overviews = lists.map((l) => getTargetListOverview(l.id)!).filter(Boolean);
  const mostRecent = [...overviews].sort((a, b) => (b.list.lastWorkedAt ?? '').localeCompare(a.list.lastWorkedAt ?? ''))[0];

  redirect(`/app/lists/${(mostRecent ?? overviews[0])!.list.id}`);
}
