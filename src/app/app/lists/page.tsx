import Link from 'next/link';
import { getTargetLists, getTargetListOverview } from '@/data';
import { EmptyState } from '@/components/states';
import { Card } from '@/components/ui/card';

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">My Lists</h1>
        <Link href="/app/lists/new" className="text-xs text-text-link hover:underline">
          + New List
        </Link>
      </div>
      {lists.map((list) => {
        const overview = getTargetListOverview(list.id)!;
        return (
          <Link key={list.id} href={`/app/lists/${list.id}`} className="block">
            <Card className="hover:bg-canvas-soft">
              <div className="text-base font-semibold text-ink">{list.name}</div>
              {list.description && <div className="mt-0.5 text-sm text-body">{list.description}</div>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>{overview.progress.total} accounts</span>
                <span>{overview.progress.worked} worked</span>
                <span>{overview.progress.remaining} remaining</span>
                <span>{overview.progress.pinnedCount} pinned</span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
