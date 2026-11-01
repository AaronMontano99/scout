'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, LayoutGrid, Mail, Phone, Plus, Rows3, Star } from 'lucide-react';
import { toggleFavoriteAction } from '@/app/actions';
import type { DirectoryRow } from '@/data/sdr';
import { STAGE_LABEL } from '@/domain/hot-list';
import { useShell } from '@/components/shell/shell';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';

type Filter = 'all' | 'hot' | 'starred' | 'booked' | 'closed' | 'cold';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot List' },
  { id: 'starred', label: 'Starred' },
  { id: 'booked', label: 'Meetings' },
  { id: 'cold', label: 'Not touched' },
  { id: 'closed', label: 'Closed' },
];

function matches(r: DirectoryRow, f: Filter): boolean {
  switch (f) {
    case 'hot':
      return Boolean(r.stage) && r.stage !== 'closed' && r.stage !== 'meeting_booked';
    case 'starred':
      return r.starred;
    case 'booked':
      return r.meetings > 0 || r.stage === 'meeting_booked';
    case 'closed':
      return r.stage === 'closed';
    case 'cold':
      return r.touches === 0;
    default:
      return true;
  }
}

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

function lastContact(iso: string | null, now: string): string {
  if (!iso) return 'Never';
  const days = Math.floor((new Date(now).getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return days < 60 ? `${days} days ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StarButton({ row }: { row: DirectoryRow }) {
  const [, startTransition] = useTransition();
  return (
    <button type="button" aria-label={row.starred ? `Unstar ${row.name}` : `Star ${row.name}`} aria-pressed={row.starred} onClick={() => startTransition(() => toggleFavoriteAction(row.id, !row.starred))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
      <Star size={15} fill={row.starred ? 'currentColor' : 'none'} className={row.starred ? 'text-[var(--accent-ink)]' : 'text-body'} />
    </button>
  );
}

function StagePill({ row }: { row: DirectoryRow }) {
  return row.stage ? (
    <span data-stage={row.stage} className="inline-flex items-center gap-2 text-[13px] text-ink">
      <span className="stage-dot" />
      {STAGE_LABEL[row.stage]}
    </span>
  ) : (
    <span className="text-[13px] text-muted">Not on the list</span>
  );
}

const SIGNAL_TEXT = { HARD: 'Hard signal', SOFT: 'Soft signal', NONE: 'No signal' };

export function AccountDirectory({ rows, now }: { rows: DirectoryRow[]; now: string }) {
  const { open } = useShell();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => matches(r, filter) && (!q || `${r.name} ${r.contact} ${r.industry ?? ''} ${r.zip ?? ''}`.toLowerCase().includes(q)));
  }, [rows, filter, query]);

  const week = 7 * 86_400_000;
  const recent = rows.filter((r) => r.lastTouchAt && new Date(now).getTime() - new Date(r.lastTouchAt).getTime() < week).length;

  return (
    <div className="rise flex flex-col gap-4">
      <PageHeader
        title="Accounts"
        subtitle={`${rows.length} companies Ferret knows. ${recent} touched in the last 7 days.`}
        actions={
          <>
            {/* A file download, not a page. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/accounts/export" className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13.5px] font-medium hover:bg-surface-strong">
              <Download size={15} />
              CSV
            </a>
            <Button type="button" onClick={() => open({ type: 'account' })}>
              <Plus size={16} />
              Add account
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[300px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, contact, ZIP" />
        </div>
        <div className="scroll-x -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-medium ${filter === f.id ? 'bg-primary text-on-primary' : 'bg-surface-strong text-body hover:text-ink'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto hidden gap-1 rounded-full bg-canvas-soft p-1 sm:flex" role="group" aria-label="View">
          <button type="button" aria-label="Grid" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={`grid h-8 w-10 place-items-center rounded-full ${view === 'grid' ? 'bg-surface-strong' : 'text-body'}`}>
            <LayoutGrid size={15} />
          </button>
          <button type="button" aria-label="Table" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`grid h-8 w-10 place-items-center rounded-full ${view === 'table' ? 'bg-surface-strong' : 'text-body'}`}>
            <Rows3 size={15} />
          </button>
        </div>
      </div>

      {visible.length === 0 && <p className="glass p-5 text-[14px] text-body">{rows.length === 0 ? 'No accounts yet. Add one, or say “I’m calling” someone and Ferret starts it for you.' : 'Nothing matches this filter.'}</p>}

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <article key={r.id} className="glass flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-strong font-head text-[15px] font-medium">{initials(r.name)}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/accounts/${r.id}`} className="block truncate font-head text-[16.5px] font-medium hover:underline">
                    {r.name}
                  </Link>
                  <p className="truncate text-[13px] text-body">{r.contact || r.industry || 'No contact yet'}</p>
                </div>
                <StarButton row={r} />
              </div>
              <div className="well grid grid-cols-2 gap-3 p-3 text-[13px]">
                <p>
                  <span className="block text-body">Last contact</span>
                  <span className="font-medium">{lastContact(r.lastTouchAt, now)}</span>
                </p>
                <p>
                  <span className="block text-body">Touches</span>
                  <span className="font-medium">
                    {r.touches}
                    {r.meetings ? `, ${r.meetings} ${r.meetings === 1 ? 'meeting' : 'meetings'}` : ''}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StagePill row={r} />
                <Link href={`/emails?a=${r.id}`} aria-label={`Email ${r.name}`} className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
                  <Mail size={14} />
                </Link>
                <Link href={`/calls?a=${r.id}`} aria-label={`Call ${r.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
                  <Phone size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-hairline text-body">
                {['Company', 'Contact', 'Stage', 'Signal', 'Last contact', 'Touches', ''].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/accounts/${r.id}`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-body">{r.contact || '—'}</td>
                  <td className="px-4 py-3">
                    <StagePill row={r} />
                  </td>
                  <td className="px-4 py-3 text-body">{SIGNAL_TEXT[r.signal]}</td>
                  <td className="px-4 py-3 text-body">{lastContact(r.lastTouchAt, now)}</td>
                  <td className="px-4 py-3">{r.touches}</td>
                  <td className="px-4 py-2">
                    <StarButton row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
