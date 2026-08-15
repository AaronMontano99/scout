'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AccountOverviewRow } from '@/data';
import { PriorityLabelChip } from './priority';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';

type Filter = 'all' | 'prospect' | 'current_customer' | 'former_customer' | 'partner' | 'needs_review';

const FILTERS: FilterChipOption<Filter>[] = [
  { id: 'all', label: 'All' },
  { id: 'prospect', label: 'Prospect' },
  { id: 'current_customer', label: 'Current Customer' },
  { id: 'former_customer', label: 'Former Customer' },
  { id: 'partner', label: 'Partner' },
  { id: 'needs_review', label: 'Needs Review' },
];

const RELATIONSHIP_LABEL: Record<string, string> = {
  prospect: 'Prospect',
  current_customer: 'Current Customer',
  former_customer: 'Former Customer',
  partner: 'Partner',
  unknown: 'Unknown Relationship',
};

function matchesFilter(row: AccountOverviewRow, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'needs_review':
      return row.account.researchStatus === 'needs_review' || row.account.identityStatus === 'review_recommended';
    default:
      return row.account.relationshipStatus === filter;
  }
}

export function AccountsBrowser({ rows }: { rows: AccountOverviewRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const q = query.toLowerCase();
  const filtered = rows
    .filter((r) => matchesFilter(r, filter))
    .filter(
      (r) => r.account.name.toLowerCase().includes(q) || (r.account.primaryDomain ?? '').toLowerCase().includes(q)
    );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search accounts by name or domain…" />
        <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        <span className="ml-auto text-xs text-muted">{filtered.length} accounts</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-8 text-center text-sm text-muted">
          No accounts match these filters.
        </div>
      ) : (
        <div className="rounded-lg border border-hairline-strong bg-surface-card">
          {filtered.map((row) => (
            <Link
              key={row.account.id}
              href={`/app/accounts/${row.account.id}`}
              className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-canvas-soft"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{row.account.name}</span>
                  {row.account.primaryDomain && (
                    <span className="truncate text-xs text-muted">{row.account.primaryDomain}</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-body">
                  <span>{RELATIONSHIP_LABEL[row.account.relationshipStatus]}</span>
                  {row.listNames.length > 0 && <span className="text-muted">{row.listNames.join(', ')}</span>}
                </div>
              </div>
              <PriorityLabelChip priority={row.priorityLabel} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
