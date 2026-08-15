'use client';

import { useState } from 'react';
import type { ListRow as DemoListRow } from '@/demo';
import type { ListRow as AppListRow } from '@/data';
import { AccountListRow, LIST_ROW_GRID } from './list-row';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { MicroLabel } from './ui/micro-label';
import { Panel } from './ui/panel';

// Lightweight client-side filtering for the Target List's "All
// Accounts" view — product spec §39. Deliberately a small fixed set of
// filters, not a full filter-builder panel (ARCHITECTURE.md's
// "don't build for hypothetical requirements" principle).

type ListRow = DemoListRow | AppListRow;
type Filter = 'all' | 'worked' | 'unworked' | 'pinned' | 'ready' | 'limited_data' | 'needs_review' | 'meeting_booked';

const FILTERS: FilterChipOption<Filter>[] = [
  { id: 'all', label: 'All' },
  { id: 'unworked', label: 'Unworked' },
  { id: 'worked', label: 'Worked' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'ready', label: 'Ready' },
  { id: 'limited_data', label: 'Limited Data' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'meeting_booked', label: 'Meeting Booked' },
];

function matchesFilter(row: ListRow, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'worked':
      return row.status === 'worked';
    case 'unworked':
      return row.status !== 'worked';
    case 'pinned':
      return row.pinned;
    case 'ready':
      return row.account.researchStatus === 'ready';
    case 'limited_data':
      return row.account.researchStatus === 'limited_data';
    case 'needs_review':
      return row.account.researchStatus === 'needs_review';
    case 'meeting_booked':
      return row.lastOutcome?.outcomeType === 'meeting_booked';
  }
}

export function AccountFilterList({
  rows,
  basePath,
  count,
}: {
  rows: ListRow[];
  basePath: '/app' | '/demo';
  count?: number;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = rows.filter((r) => matchesFilter(r, filter));

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-[22px] py-[15px]">
        <MicroLabel>All Accounts {count ?? rows.length}</MicroLabel>
        <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">No accounts match these filters.</div>
      ) : (
        <>
          <div className={`grid ${LIST_ROW_GRID} gap-4 bg-canvas-soft px-[22px] py-2 border-b border-hairline`}>
            <div />
            <MicroLabel>Account</MicroLabel>
            <MicroLabel>Priority</MicroLabel>
            <MicroLabel>Status</MicroLabel>
            <MicroLabel>Last Activity</MicroLabel>
            <MicroLabel>Sources</MicroLabel>
            <div />
          </div>
          {filtered.map((row) => (
            <AccountListRow key={row.itemId} row={row} basePath={basePath} />
          ))}
        </>
      )}
    </Panel>
  );
}
