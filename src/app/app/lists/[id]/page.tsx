import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTargetLists, getTargetListOverview, getListRows, getSuggestedCalls, getIdentityWarning } from '@/data';
import type { ListPickerEntry } from '@/components/target-list-picker';
import { AccountFilterList } from '@/components/account-filter-list';
import { PriorityLabelChip } from '@/components/priority';
import { PinToggleButton, MarkWorkedButton } from '@/components/list-item-actions';
import { TargetListPicker } from '@/components/target-list-picker';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';
import { PageHeader } from '@/components/ui/page-header';

// Target List workspace for your real data — two-pane layout matching
// scout-ui.html's Lists screen: a list picker on the left, the
// selected list's full detail on the right. See docs/LOCAL_MODE.md.

export default async function TargetListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const overview = getTargetListOverview(id);
  if (!overview) notFound();
  const { list, progress } = overview;

  const rows = getListRows(id);
  const suggested = getSuggestedCalls(id, 50);
  const pickerEntries: ListPickerEntry[] = getTargetLists().map((l) => {
    if (l.id === id) return { list: l, progress };
    const other = getTargetListOverview(l.id)!;
    return { list: other.list, progress: other.progress };
  });

  const pct = progress.total > 0 ? Math.round((progress.worked / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Lists"
        subtitle="Persistent prospecting workspaces. Progress never resets between sessions."
        actions={
          <Link href="/app/lists/new">
            <Button className="!px-[18px] !py-[11px] !text-[13.5px]">Create list</Button>
          </Link>
        }
      />

      <div className="flex items-start gap-5">
        <TargetListPicker entries={pickerEntries} activeId={id} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Panel className="p-[20px_22px]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{list.name}</h2>
                {list.description && <p className="mt-1 text-[13.5px] text-body">{list.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {suggested[0] && (
                  <Link href={`/app/accounts/${suggested[0].account.id}`}>
                    <Button className="!px-4 !py-2.5 !text-[13px]">Work suggested calls</Button>
                  </Link>
                )}
                <Link href={`/app/lists/${id}/edit`}>
                  <Button variant="secondary" className="!px-4 !py-2.5 !text-[13px]">
                    Edit list
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-[18px] flex items-center gap-6 border-t border-hairline pt-4">
              {[
                { value: progress.total, label: 'Accounts' },
                { value: progress.worked, label: 'Worked' },
                { value: progress.remaining, label: 'Remaining' },
                { value: progress.pinnedCount, label: 'Pinned' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[19px] font-semibold text-ink">{m.value}</div>
                  <MicroLabel className="mt-0.5">{m.label}</MicroLabel>
                </div>
              ))}
              <div className="min-w-0 flex-1 border-l border-hairline pl-[22px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-ink">
                    {progress.worked}/{progress.total} WORKED ({pct}%)
                  </span>
                  <span className="text-[11.5px] text-muted">Research focus: {list.researchFocus ?? 'General'}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-surface-strong">
                  <div className="h-1 rounded-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-hairline px-[22px] py-[15px]">
              <MicroLabel>Suggested Calls {suggested.length}</MicroLabel>
              <span className="text-[11.5px] text-muted">Pinned accounts always rank first.</span>
            </div>
            {suggested.length === 0 ? (
              <p className="px-[22px] py-6 text-sm text-muted">No accounts to work yet — add one below.</p>
            ) : (
              <div>
                <div className="grid grid-cols-[150px_1fr_1fr_120px] gap-4 border-b border-hairline bg-canvas-soft px-[22px] py-2">
                  <MicroLabel>Priority</MicroLabel>
                  <MicroLabel>Account</MicroLabel>
                  <MicroLabel>Why This Rank</MicroLabel>
                  <div />
                </div>
                {suggested.map((entry) => {
                  const warning = getIdentityWarning(entry.account.id);
                  return (
                    <div
                      key={entry.item.id}
                      className="grid grid-cols-[150px_1fr_1fr_120px] items-center gap-4 border-b border-hairline px-[22px] py-3 last:border-b-0"
                    >
                      <PriorityLabelChip priority={entry.priorityLabel} />
                      <div className="flex min-w-0 items-center gap-1.5">
                        <PinToggleButton itemId={entry.item.id} pinned={entry.pinned} />
                        <Link href={`/app/accounts/${entry.account.id}`} className="truncate text-[13.5px] font-medium text-ink hover:underline">
                          {entry.account.name}
                        </Link>
                      </div>
                      <div className="truncate text-[12.5px] text-body">
                        {entry.reasons.join(' · ')}
                        {warning && <span className="text-accent-warning"> · {warning.warning}</span>}
                      </div>
                      <div className="flex justify-end">
                        <MarkWorkedButton itemId={entry.item.id} worked={entry.item.status === 'worked'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="flex items-center justify-end">
            <Link href={`/app/lists/${id}/add-account`} className="text-[12.5px] text-text-link hover:underline">
              + Add Account to List
            </Link>
          </div>

          {rows.length === 0 ? (
            <Panel className="px-[22px] py-8 text-center text-sm text-muted">No accounts on this list yet.</Panel>
          ) : (
            <AccountFilterList rows={rows} basePath="/app" count={rows.length} />
          )}
        </div>
      </div>
    </div>
  );
}
