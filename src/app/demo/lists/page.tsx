import Link from 'next/link';
import { getTargetLists, getTargetListOverview } from '@/demo';
import { EmptyState } from '@/components/states';
import { Card } from '@/components/ui/card';

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
          <Link key={list.id} href={`/demo/lists/${list.id}`} className="block">
            <Card className="hover:bg-canvas-soft">
              <div className="text-base font-semibold text-ink">{list.name}</div>
              {list.description && <div className="mt-0.5 text-sm text-body">{list.description}</div>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>{overview.progress.total} accounts</span>
                <span>{overview.progress.worked} worked</span>
                <span>{overview.progress.remaining} remaining</span>
                <span>{overview.progress.pinnedCount} pinned</span>
                <span>{overview.researchProgress.ready} ready</span>
                {overview.researchProgress.processing > 0 && (
                  <span>{overview.researchProgress.processing} processing</span>
                )}
                {overview.researchProgress.needsReview > 0 && (
                  <span>{overview.researchProgress.needsReview} needs review</span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
