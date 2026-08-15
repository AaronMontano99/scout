import { notFound } from 'next/navigation';
import { getTargetListOverview, getListRows, getSuggestedCalls, getIdentityWarning } from '@/data';
import { AccountFilterList } from '@/components/account-filter-list';
import { PriorityLabelChip } from '@/components/priority';
import { PinToggleButton, MarkWorkedButton } from '@/components/list-item-actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Target List workspace for your real data — same layout as
// src/app/demo/lists/[id]/page.tsx. See docs/LOCAL_MODE.md.

export default async function TargetListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const overview = getTargetListOverview(id);
  if (!overview) notFound();
  const { list, progress } = overview;

  const rows = getListRows(id);
  const suggested = getSuggestedCalls(id, 50);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="text-xs text-muted">
          <Link href="/app/lists" className="hover:text-ink">
            My Lists
          </Link>{' '}
          / {list.name}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{list.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-body">
          <span>{progress.total} accounts</span>
          <span>{progress.worked} worked</span>
          <span>{progress.remaining} remaining</span>
          <span>{progress.pinnedCount} pinned</span>
          <span>Research focus: {list.researchFocus ?? 'General'}</span>
          {list.lastWorkedAt && <span>Last worked: {new Date(list.lastWorkedAt).toLocaleDateString()}</span>}
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Suggested Calls ({suggested.length})
          </h2>
          {suggested[0] && (
            <Link href={`/app/accounts/${suggested[0].account.id}`}>
              <Button variant="secondary" className="!px-3 !py-1 text-xs">
                Work Suggested Calls
              </Button>
            </Link>
          )}
        </div>
        {suggested.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No accounts to work yet — add one below.</p>
        ) : (
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
            {suggested.map((entry) => {
              const warning = getIdentityWarning(entry.account.id);
              return (
                <div
                  key={entry.item.id}
                  className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
                >
                  <Link href={`/app/accounts/${entry.account.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
                    <PinToggleButton itemId={entry.item.id} pinned={entry.pinned} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{entry.account.name}</div>
                      {entry.reasons.length > 0 && (
                        <div className="truncate text-xs text-muted">{entry.reasons.join(' · ')}</div>
                      )}
                      {warning && <div className="text-xs text-accent-warning">{warning.warning}</div>}
                    </div>
                  </Link>
                  <PriorityLabelChip priority={entry.priorityLabel} />
                  <MarkWorkedButton itemId={entry.item.id} worked={entry.item.status === 'worked'} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            All Accounts ({rows.length})
          </h2>
          <Link href={`/app/lists/${id}/add-account`} className="text-xs text-text-link hover:underline">
            + Add Account to List
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No accounts on this list yet.</p>
        ) : (
          <AccountFilterList rows={rows} basePath="/app" />
        )}
      </section>
    </div>
  );
}
