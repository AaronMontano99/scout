'use client';

import { useState } from 'react';
import type { ListRow } from '@/demo';
import { AccountListRow } from './list-row';

// Lightweight client-side filtering for the Target List's "All
// Accounts" view — product spec §39. Deliberately a small fixed set of
// filters, not a full filter-builder panel (ARCHITECTURE.md's
// "don't build for hypothetical requirements" principle).

type Filter = 'all' | 'worked' | 'unworked' | 'pinned' | 'ready' | 'limited_data' | 'needs_review' | 'meeting_booked';

const FILTERS: { id: Filter; label: string }[] = [
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

export function AccountFilterList({ rows }: { rows: ListRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = rows
    .filter((r) => matchesFilter(r, filter))
    .filter((r) => r.account.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search accounts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-8 text-center text-sm text-muted">
          No accounts match these filters.
        </div>
      ) : (
        <div className="rounded-lg border border-hairline-strong bg-surface-card">
          {filtered.map((row) => (
            <AccountListRow key={row.itemId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
