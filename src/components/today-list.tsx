'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TodayRow } from '@/data';
import { PriorityLabelChip } from './priority';
import { CertaintyBadge } from './badges';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';
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
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search accounts…" />
        <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        <span className="ml-auto text-xs text-muted">{filtered.length} accounts</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-8 text-center text-sm text-muted">
          No accounts match these filters.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((row) => {
            const { entry } = row;
            return (
              <Link
                key={entry.account.id}
                href={`/app/accounts/${entry.account.id}`}
                className="block rounded-lg border border-hairline-strong bg-surface-card px-4 py-3 hover:bg-canvas-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PinToggleButton itemId={entry.item.id} pinned={entry.pinned} />
                      <span className="truncate text-sm font-medium text-ink">{entry.account.name}</span>
                      {entry.account.primaryDomain && (
                        <span className="truncate text-xs text-muted">{entry.account.primaryDomain}</span>
                      )}
                      <PriorityLabelChip priority={entry.priorityLabel} />
                    </div>

                    {entry.reasons.length > 0 && (
                      <div className="mt-1 text-xs text-body">{entry.reasons.join(' · ')}</div>
                    )}

                    <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-body sm:grid-cols-2">
                      <div>
                        <span className="text-muted">Key person: </span>
                        {row.keyPerson ? (
                          <>
                            {row.keyPerson.name}
                            {row.keyPerson.title && <span className="text-muted"> · {row.keyPerson.title}</span>}{' '}
                            <CertaintyBadge certainty={row.keyPerson.certainty} />
                          </>
                        ) : (
                          <span className="text-muted">No person on file</span>
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-muted">What we know: </span>
                        {row.whatWeKnow ?? <span className="text-muted">Nothing recorded yet</span>}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                      <span>{row.freshnessLabel}</span>
                      {row.flag && <span className="text-accent-warning">{row.flag}</span>}
                    </div>
                  </div>

                  <MarkWorkedButton itemId={entry.item.id} worked={entry.item.status === 'worked'} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
