'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { qualifyInAction, qualifyOutAction } from '@/app/actions';
import { EMAIL_STATUS_LABEL, QUALIFICATION_LABEL, type EmailLogRow, type EmailStatus, type Qualification } from '@/domain/email-log';
import { MicroLabel } from '@/components/ui/micro-label';

type Filter = 'all' | Qualification | EmailStatus;

const QUAL_CLASS: Record<Qualification, string> = {
  in: 'bg-good-soft text-good',
  out: 'bg-bad-soft text-bad',
  not_yet: 'bg-warn-soft text-warn',
  unassessed: 'bg-surface-strong text-body',
};

const STATUS_CLASS: Record<EmailStatus, string> = {
  meeting_booked: 'text-good font-semibold',
  replied: 'text-info font-semibold',
  awaiting_reply: 'text-ink',
  call_first: 'text-warn',
  skipped: 'text-body',
  drafted: 'text-body',
};

function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '';
}

/** Who's been emailed, where each thread stands, and who's qualified IN or OUT (and why). */
export function EmailLog({ rows }: { rows: EmailLogRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) {
      c[r.qualification] = (c[r.qualification] ?? 0) + 1;
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [rows]);
  const visible = rows.filter((r) => filter === 'all' || r.qualification === filter || r.status === filter);

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: `All (${rows.length})` },
    { id: 'in', label: `Qualified IN (${counts.in ?? 0})` },
    { id: 'out', label: `Qualified OUT (${counts.out ?? 0})` },
    { id: 'not_yet', label: `Not yet (${counts.not_yet ?? 0})` },
    { id: 'awaiting_reply', label: `Awaiting reply (${counts.awaiting_reply ?? 0})` },
    { id: 'replied', label: `Replied (${counts.replied ?? 0})` },
    { id: 'meeting_booked', label: `Meetings (${counts.meeting_booked ?? 0})` },
  ];

  if (rows.length === 0) {
    return <p className="text-[13px] text-muted">No emails yet. Everything you write, send, and hear back on shows up here with its status.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${filter === c.id ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="glass overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-[minmax(150px,1fr)_minmax(150px,1.1fr)_150px_130px_minmax(200px,1.6fr)_minmax(180px,1.3fr)] gap-3 border-b border-hairline bg-canvas-soft px-4 py-2">
          <MicroLabel>Company</MicroLabel>
          <MicroLabel>Last email</MicroLabel>
          <MicroLabel>Status</MicroLabel>
          <MicroLabel>Qualified</MicroLabel>
          <MicroLabel>Why</MicroLabel>
          <MicroLabel>Next step</MicroLabel>
        </div>
        {visible.length === 0 && <p className="px-4 py-4 text-[13px] text-muted">Nothing matches this filter.</p>}
        {visible.map((r) => (
          <Row key={r.accountId} row={r} />
        ))}
      </div>
    </div>
  );
}

function Row({ row: r }: { row: EmailLogRow }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'in' | 'out' | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const submit = () => {
    const which = mode;
    if (!which) return;
    startTransition(async () => {
      if (which === 'out') await qualifyOutAction(r.accountId, reason);
      else {
        const res = await qualifyInAction(r.accountId, reason);
        if (res?.error) setNote(res.error);
      }
      setMode(null);
      setReason('');
    });
  };

  return (
    <div className="border-b border-hairline last:border-b-0">
      <div className="grid min-w-[980px] grid-cols-[minmax(150px,1fr)_minmax(150px,1.1fr)_150px_130px_minmax(200px,1.6fr)_minmax(180px,1.3fr)] items-start gap-3 px-4 py-3 text-[12.5px] leading-[1.5]">
        <div className="min-w-0">
          <Link href={`/emails?a=${r.accountId}`} className="block truncate text-[13.5px] font-medium text-ink hover:underline">
            {r.company}
          </Link>
          {r.contact && <span className="block truncate text-muted">{r.contact}</span>}
        </div>
        <div className="min-w-0">
          <span className="block truncate text-ink" title={r.subject}>
            {r.subject || '—'}
          </span>
          <span className="text-muted">
            {r.lastSentAt ? `Sent ${shortDate(r.lastSentAt)}` : 'Not sent'}
            {r.lastReplyAt ? ` · Reply ${shortDate(r.lastReplyAt)}` : ''}
          </span>
        </div>
        <span className={STATUS_CLASS[r.status]}>{EMAIL_STATUS_LABEL[r.status]}</span>
        <div className="flex flex-col items-start gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${QUAL_CLASS[r.qualification]}`}>{QUALIFICATION_LABEL[r.qualification]}</span>
          {!mode && (
            <span className="flex gap-2 text-[12px]">
              {r.qualification !== 'in' && (
                <button type="button" onClick={() => setMode('in')} className="text-text-link hover:underline">
                  Mark IN
                </button>
              )}
              {r.qualification !== 'out' && (
                <button type="button" onClick={() => setMode('out')} className="text-text-link hover:underline">
                  Mark OUT
                </button>
              )}
            </span>
          )}
        </div>
        <span className="text-body">{r.reason || '—'}</span>
        <span className="text-ink">{r.nextStep || '—'}</span>
      </div>
      {mode && (
        <div className="flex items-center gap-2 bg-canvas-soft px-4 py-2.5">
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={mode === 'out' ? 'Why is it out? e.g. centralized at corporate, no local authority' : 'Why is it in? e.g. they replied, IT team is stretched'}
            className="flex-1 rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-[12.5px]"
          />
          <button type="button" disabled={pending} onClick={submit} className="rounded-md bg-ink px-3 py-1.5 text-[12.5px] font-medium text-canvas disabled:opacity-60">
            {pending ? (mode === 'in' ? 'Adding to Hot List…' : 'Saving…') : mode === 'in' ? 'Qualify IN' : 'Qualify OUT'}
          </button>
          <button type="button" onClick={() => setMode(null)} className="text-[12.5px] text-muted hover:text-ink">
            Cancel
          </button>
        </div>
      )}
      {note && <p className="px-4 pb-2 text-[12px] text-warn">{note}</p>}
    </div>
  );
}
