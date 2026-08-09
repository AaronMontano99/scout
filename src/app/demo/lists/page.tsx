import Link from 'next/link';
import { getTargetLists, getTargetListOverview } from '@/demo';
import { EmptyState } from '@/components/states';

export default function ListsIndexPage() {
  const lists = getTargetLists();

  if (lists.length === 0) {
    return (
      <EmptyState
        title="No Target Lists Yet"
        body="Upload the companies you want to prospect and Scout will begin doing the homework."
        ctaLabel="Create Target List"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold text-ink">My Lists</h1>
      {lists.map((list) => {
        const overview = getTargetListOverview(list.id)!;
        return (
          <Link
            key={list.id}
            href={`/demo/lists/${list.id}`}
            className="rounded-lg border border-hairline-strong bg-surface-card p-4 hover:bg-canvas-soft"
          >
            <div className="text-base font-semibold text-ink">{list.name}</div>
            {list.description && <div className="mt-0.5 text-sm text-body">{list.description}</div>}
            <div className="mt-2 text-xs text-muted">
              {overview.progress.total} accounts · {overview.progress.worked} worked ·{' '}
              {overview.progress.remaining} remaining · {overview.progress.pinnedCount} pinned
            </div>
          </Link>
        );
      })}
    </div>
  );
}
