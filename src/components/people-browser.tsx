'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PersonRow } from '@/data';
import type { CertaintyType } from '@/types/evidence';
import { CertaintyBadge } from './badges';
import { Avatar } from './ui/avatar';
import { FilterChipGroup, type FilterChipOption } from './ui/filter-chip';
import { SearchInput } from './ui/search-input';
import { MicroLabel } from './ui/micro-label';
import { Panel } from './ui/panel';
import { Button } from './ui/button';

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

const ROLE_LABEL: Record<string, string> = {
  decision_maker: 'Decision Maker',
  economic_buyer: 'Economic Buyer',
  champion: 'Champion',
  influencer: 'Influencer',
  technical_buyer: 'Technical Buyer',
  blocker: 'Blocker',
  unknown: 'Unknown',
};

const CERTAINTY_EXPLANATION: Record<CertaintyType, string> = {
  KNOWN: 'Confirmed directly — you or a trusted source entered this as fact.',
  INFERRED: 'Inferred from context. Not yet confirmed — verify before relying on it.',
  SUGGESTED: 'A low-confidence suggestion. Treat as a starting point, not a fact.',
};

const GRID_COLS = 'grid-cols-[180px_1fr_150px_130px_110px]';

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
  const [query, setQuery] = useState('');
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
    <div className="flex items-start gap-5">
      <Panel className="min-w-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3.5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search people by name, company, or role…" />
        </div>
        <div className="border-b border-hairline px-4 py-3">
          <FilterChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {accountFilter && (
          <div className="border-b border-hairline px-4 py-2">
            <button
              type="button"
              onClick={() => setAccountFilter(undefined)}
              className="rounded-full bg-surface-strong px-3 py-1 text-xs text-body hover:text-ink"
            >
              Filtered to {rows.find((r) => r.account.id === accountFilter)?.account.name ?? 'account'} ✕
            </button>
          </div>
        )}

        <div className={`grid ${GRID_COLS} gap-3.5 border-b border-hairline bg-canvas-soft px-4 py-2`}>
          <MicroLabel>Person</MicroLabel>
          <MicroLabel>Account / Title</MicroLabel>
          <MicroLabel>Buying Role</MicroLabel>
          <MicroLabel>Certainty</MicroLabel>
          <MicroLabel>Verified</MicroLabel>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">No people match these filters.</div>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            {filtered.map((r) => (
              <button
                key={r.contact.id}
                type="button"
                onClick={() => setSelectedId(r.contact.id)}
                className={`grid ${GRID_COLS} w-full items-center gap-3.5 border-b border-hairline px-4 py-3 text-left last:border-b-0 hover:bg-canvas-soft ${
                  selected?.contact.id === r.contact.id ? 'bg-canvas-soft' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={personName(r.contact)} />
                  <span className="truncate text-[13.5px] font-medium text-ink">{personName(r.contact)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] text-ink">{r.account.name}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">{r.contact.title ?? 'No title on file'}</span>
                </span>
                <span className="truncate text-[12.5px] text-ink">{ROLE_LABEL[r.relationship.roleHypothesis]}</span>
                <span>
                  <CertaintyBadge certainty={r.relationship.certaintyType} />
                </span>
                <span className="text-[11.5px] text-muted">{r.freshnessLabel}</span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {selected && (
        <Panel className="w-[430px] shrink-0 overflow-hidden">
          <div className="border-b border-hairline px-[22px] pt-5 pb-[18px]">
            <div className="flex items-center gap-3">
              <Avatar name={personName(selected.contact)} size="lg" />
              <div className="min-w-0">
                <div className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{personName(selected.contact)}</div>
                <div className="mt-0.5 text-[12.5px] text-body">
                  {selected.contact.title ?? 'No title on file'} · {selected.account.name}
                </div>
              </div>
            </div>
            <div className="mt-3.5 flex items-center gap-2">
              <span className="inline-flex rounded-full bg-surface-strong px-2.5 py-0.5 text-[11.5px] font-medium text-ink">
                {ROLE_LABEL[selected.relationship.roleHypothesis]}
              </span>
              <CertaintyBadge certainty={selected.relationship.certaintyType} />
            </div>
            <div className="mt-3.5 flex gap-2">
              <Link href={`/app/accounts/${selected.account.id}`}>
                <Button className="!px-[15px] !py-[9px] !text-[12.5px]">Open brief</Button>
              </Link>
              <Link href={`/app/accounts/${selected.account.id}?expand=1`}>
                <Button variant="secondary" className="!px-[15px] !py-[9px] !text-[12.5px]">
                  View full account
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-[22px] py-[18px]">
            <div>
              <MicroLabel>Why This Person Matters</MicroLabel>
              <p className="mt-2 text-[13px] leading-[1.5] text-body">{CERTAINTY_EXPLANATION[selected.relationship.certaintyType]}</p>
              {selected.sourceNote && (
                <p className="mt-2 text-[13px] leading-[1.5] text-body">
                  <span className="text-muted">Why: </span>
                  {selected.sourceNote}
                </p>
              )}
            </div>

            {related.length > 0 && (
              <div className="border-t border-hairline pt-4">
                <MicroLabel>Related People</MicroLabel>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {related.map((r) => (
                    <li key={r.contact.id}>
                      <button type="button" onClick={() => setSelectedId(r.contact.id)} className="text-[12.5px] text-text-link hover:underline">
                        {personName(r.contact)} — {r.contact.title ?? 'No title'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
