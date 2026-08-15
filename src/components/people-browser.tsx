'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PersonRow } from '@/data';
import type { CertaintyType } from '@/types/evidence';
import { CertaintyBadge, RoleBadge } from './badges';
import { FreshnessChip } from './priority';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';

type Filter = 'all' | 'known' | 'inferred' | 'suggested' | 'champion' | 'decision_maker' | 'economic_buyer';

const FILTERS: FilterChipOption<Filter>[] = [
  { id: 'all', label: 'All' },
  { id: 'known', label: 'Known' },
  { id: 'inferred', label: 'Inferred' },
  { id: 'suggested', label: 'Suggested' },
  { id: 'champion', label: 'Champions' },
  { id: 'decision_maker', label: 'Decision Makers' },
  { id: 'economic_buyer', label: 'Economic Buyers' },
];

const CERTAINTY_EXPLANATION: Record<CertaintyType, string> = {
  KNOWN: 'Confirmed directly — you or a trusted source entered this as fact.',
  INFERRED: 'Inferred from context. Not yet confirmed — verify before relying on it.',
  SUGGESTED: 'A low-confidence suggestion. Treat as a starting point, not a fact.',
};

function personName(contact: PersonRow['contact']): string {
  return `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'Unnamed contact';
}

function matchesFilter(row: PersonRow, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'known':
    case 'inferred':
    case 'suggested':
      return row.relationship.certaintyType === filter.toUpperCase();
    default:
      return row.relationship.roleHypothesis === filter;
  }
}

export function PeopleBrowser({ rows, initialAccountId }: { rows: PersonRow[]; initialAccountId?: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState(initialAccountId ? '' : '');
  const [accountFilter, setAccountFilter] = useState<string | undefined>(initialAccountId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = query.toLowerCase();
  const filtered = rows
    .filter((r) => matchesFilter(r, filter))
    .filter((r) => !accountFilter || r.account.id === accountFilter)
    .filter(
      (r) =>
        personName(r.contact).toLowerCase().includes(q) ||
        r.account.name.toLowerCase().includes(q) ||
        (r.contact.title ?? '').toLowerCase().includes(q)
    );

  const selected = filtered.find((r) => r.contact.id === selectedId) ?? filtered[0] ?? null;
  const related = selected ? rows.filter((r) => r.account.id === selected.account.id && r.contact.id !== selected.contact.id) : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search people by name, company, or role…" />
        <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        {accountFilter && (
          <button
            type="button"
            onClick={() => setAccountFilter(undefined)}
            className="rounded-full bg-surface-strong px-3 py-1 text-xs text-body hover:text-ink"
          >
            Filtered to {rows.find((r) => r.account.id === accountFilter)?.account.name ?? 'account'} ✕
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{filtered.length} people</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-8 text-center text-sm text-muted">
            No people match these filters.
          </div>
        ) : (
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
            {filtered.map((r) => (
              <button
                key={r.contact.id}
                type="button"
                onClick={() => setSelectedId(r.contact.id)}
                className={`flex w-full items-center justify-between gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0 hover:bg-canvas-soft ${
                  selected?.contact.id === r.contact.id ? 'bg-canvas-soft' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{personName(r.contact)}</span>
                    <RoleBadge role={r.relationship.roleHypothesis} />
                    <CertaintyBadge certainty={r.relationship.certaintyType} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-body">
                    {r.contact.title ?? 'No title on file'} · {r.account.name}
                  </div>
                </div>
                <FreshnessChip label={r.freshnessLabel} />
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="h-fit rounded-lg border border-hairline-strong bg-surface-card p-4">
            <div className="text-sm font-semibold text-ink">{personName(selected.contact)}</div>
            <div className="text-xs text-body">
              {selected.contact.title ?? 'No title on file'} · {selected.account.name}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <RoleBadge role={selected.relationship.roleHypothesis} />
              <CertaintyBadge certainty={selected.relationship.certaintyType} />
            </div>
            <p className="mt-2 text-xs text-body">{CERTAINTY_EXPLANATION[selected.relationship.certaintyType]}</p>
            {selected.sourceNote && (
              <p className="mt-2 text-xs text-body">
                <span className="text-muted">Why: </span>
                {selected.sourceNote}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Link
                href={`/app/accounts/${selected.account.id}`}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary"
              >
                Open Brief
              </Link>
              <Link
                href={`/app/accounts/${selected.account.id}`}
                className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft"
              >
                Open Account
              </Link>
            </div>

            {related.length > 0 && (
              <div className="mt-4 border-t border-hairline pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">Related People</div>
                <ul className="mt-2 flex flex-col gap-2">
                  {related.map((r) => (
                    <li key={r.contact.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.contact.id)}
                        className="text-xs text-text-link hover:underline"
                      >
                        {personName(r.contact)} — {r.contact.title ?? 'No title'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
