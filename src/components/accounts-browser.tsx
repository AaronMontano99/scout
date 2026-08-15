'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AccountOverviewRow } from '@/data';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';
import { MicroLabel } from './ui/micro-label';
import { Panel } from './ui/panel';

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
    <Panel className="w-full max-w-[440px] shrink-0 overflow-hidden">
      <div className="border-b border-hairline px-4 py-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <MicroLabel>All Accounts</MicroLabel>
          <span className="font-mono text-[10px] text-[#B8BDC4]">{rows.length}</span>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search accounts by name or domain…" />
        <div className="mt-2.5">
          <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">No accounts match these filters.</div>
      ) : (
        <div className="max-h-[640px] overflow-auto">
          {filtered.map((row) => (
            <Link
              key={row.account.id}
              href={`/app/accounts/${row.account.id}`}
              className="block border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-canvas-soft"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-medium text-ink">{row.account.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="truncate text-[11.5px] text-muted">{row.account.primaryDomain ?? '—'}</span>
                <span className="inline-flex shrink-0 rounded-full bg-surface-strong px-2 py-0.5 text-[10.5px] text-body">
                  {RELATIONSHIP_LABEL[row.account.relationshipStatus]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-body">{row.listNames.join(', ') || 'Not on any list'}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[row.priorityLabel]}`} />
                  <span className="text-[11.5px] text-muted">{PRIORITY_TEXT[row.priorityLabel]}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
