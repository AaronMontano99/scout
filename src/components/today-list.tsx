'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TodayRow } from '@/data';
import { CertaintyBadge } from './badges';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';
import { MicroLabel } from './ui/micro-label';
import { Panel } from './ui/panel';
import { PinToggleButton, MarkWorkedButton } from './list-item-actions';

type Filter = 'all' | 'strong_context' | 'useful_context' | 'limited_data' | 'unworked' | 'needs_review';

const FILTERS: FilterChipOption<Filter>[] = [
  { id: 'all', label: 'All' },
  { id: 'strong_context', label: 'Strong Context' },
  { id: 'useful_context', label: 'Useful Context' },
  { id: 'limited_data', label: 'Limited Data' },
  { id: 'unworked', label: 'Unworked' },
  { id: 'needs_review', label: 'Needs Review' },
];

const PRIORITY_DOT: Record<string, string> = {
  strong_context: 'bg-semantic-success',
  useful_context: 'bg-text-link',
  limited_data: 'bg-muted',
  lower_confidence: 'bg-accent-warning',
};
const PRIORITY_TEXT: Record<string, string> = {
  strong_context: 'Strong Context',
  useful_context: 'Useful Context',
  limited_data: 'Limited Data',
  lower_confidence: 'Lower Confidence',
};

const GRID_COLS = 'grid-cols-[32px_220px_1fr_150px_1fr_1fr_120px]';

function matchesFilter(row: TodayRow, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'strong_context':
    case 'useful_context':
    case 'limited_data':
      return row.entry.priorityLabel === filter;
    case 'unworked':
      return row.entry.item.status !== 'worked';
    case 'needs_review':
      return row.entry.account.researchStatus === 'needs_review' || row.entry.account.identityStatus === 'review_recommended';
  }
}

export function TodayList({ rows }: { rows: TodayRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = rows
    .filter((r) => matchesFilter(r, filter))
    .filter((r) => r.entry.account.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-4">
        <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        <div className="w-[260px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search accounts…" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="px-4 py-10 text-center text-sm text-muted">No accounts match these filters.</Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div className={`grid ${GRID_COLS} gap-4 border-b border-hairline bg-canvas-soft px-[18px] py-2.5`}>
            <div />
            <MicroLabel>Account</MicroLabel>
            <MicroLabel>Why Now</MicroLabel>
            <MicroLabel>Key Person</MicroLabel>
            <MicroLabel>What We Know</MicroLabel>
            <MicroLabel>Suggested Angle</MicroLabel>
            <div />
          </div>

          {filtered.map((row) => {
            const { entry } = row;
            return (
              <div
                key={entry.account.id}
                className={`grid ${GRID_COLS} items-start gap-4 border-b border-hairline px-[18px] py-4 last:border-b-0 hover:bg-canvas-soft`}
              >
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <PinToggleButton itemId={entry.item.id} pinned={entry.pinned} />
                </div>

                <div className="min-w-0">
                  <Link href={`/app/accounts/${entry.account.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">
                    {entry.account.name}
                  </Link>
                  <div className="mt-0.5 truncate text-xs text-muted">{entry.account.primaryDomain}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[entry.priorityLabel]}`} />
                    <span className="text-xs text-body">{PRIORITY_TEXT[entry.priorityLabel]}</span>
                  </div>
                  {row.flag && <div className="mt-1.5 text-[11.5px] leading-tight text-accent-warning">{row.flag}</div>}
                </div>

                <div className="text-[13px] leading-relaxed text-ink">
                  {entry.reasons.length > 0 ? entry.reasons.join(' · ') : <span className="text-muted">—</span>}
                </div>

                <div>
                  {row.keyPerson ? (
                    <div>
                      <div className="text-[13px] font-medium text-ink">{row.keyPerson.name}</div>
                      <div className="mt-0.5 text-xs text-body">{row.keyPerson.title}</div>
                      <div className="mt-1.5">
                        <CertaintyBadge certainty={row.keyPerson.certainty} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12.5px] text-muted">No person on file</span>
                  )}
                </div>

                <div className="truncate text-[13px] leading-relaxed text-body">
                  {row.whatWeKnow ?? <span className="text-muted">Nothing recorded yet</span>}
                </div>

                <div className="truncate text-[13px] leading-relaxed text-body">
                  {row.suggestedAngle ?? <span className="text-muted">—</span>}
                </div>

                <div className="flex justify-end">
                  <MarkWorkedButton itemId={entry.item.id} worked={entry.item.status === 'worked'} />
                </div>
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
}
