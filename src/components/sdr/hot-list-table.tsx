'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { updateHotListAction } from '@/app/actions';
import {
  NEXT_ACTION_LABEL,
  STAGE_LABEL,
  actionFlag,
  isActive,
  sortHotList,
  type ActionFlag,
  type HotListEntry,
  type HotPriority,
  type HotStage,
  type NextAction,
} from '@/domain/hot-list';
import { MicroLabel } from '@/components/ui/micro-label';
import { SearchInput } from '@/components/ui/search-input';

const FLAG_CLASS: Record<ActionFlag, string> = {
  'ACT NOW': 'bg-[#FDECEC] text-[#9B1C1C]',
  'SET DATE': 'bg-[#FFF1D6] text-[#8A5300]',
  DUE: 'bg-[#FFF1D6] text-[#8A5300]',
  UPCOMING: 'bg-[#E0EDFF] text-[#1E4FA8]',
  LATER: 'bg-surface-strong text-muted',
};
const PRIORITY_SELECT: Record<HotPriority, string> = {
  HIGH: 'bg-[#DCFCE7] text-[#166534]',
  MEDIUM: 'bg-[#E0EDFF] text-[#1E4FA8]',
  LOW: 'bg-surface-strong text-body',
};
const FLAGS: ActionFlag[] = ['ACT NOW', 'DUE', 'UPCOMING', 'LATER', 'SET DATE'];
const PRIORITIES: HotPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export function FlagBadge({ flag }: { flag: ActionFlag }) {
  return <span className={`inline-flex shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.05em] ${FLAG_CLASS[flag]}`}>{flag}</span>;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${on ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

export function HotListTable({ entries, today }: { entries: HotListEntry[]; today: string }) {
  const [priority, setPriority] = useState<HotPriority | 'all'>('all');
  const [flag, setFlag] = useState<ActionFlag | 'all'>('all');
  const [stage, setStage] = useState<HotStage | 'active'>('active');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const active = useMemo(() => entries.filter((e) => isActive(e.stage)), [entries]);
  const counts = useMemo(() => {
    const byFlag = Object.fromEntries(FLAGS.map((f) => [f, 0])) as Record<ActionFlag, number>;
    const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<HotPriority, number>;
    for (const e of active) {
      byFlag[actionFlag(e.nextTouchDate, today)] += 1;
      byPriority[e.priority] += 1;
    }
    return { byFlag, byPriority };
  }, [active, today]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortHotList(
      entries.filter(
        (e) =>
          (stage === 'active' ? isActive(e.stage) : e.stage === stage) &&
          (priority === 'all' || e.priority === priority) &&
          (flag === 'all' || actionFlag(e.nextTouchDate, today) === flag) &&
          (!q || `${e.accountName} ${e.contact} ${e.angle} ${e.whyQualified}`.toLowerCase().includes(q))
      ),
      today
    );
  }, [entries, stage, priority, flag, query, today]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FLAGS.filter((f) => f !== 'SET DATE' || counts.byFlag['SET DATE'] > 0).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFlag(flag === f ? 'all' : f)}
            className={`rounded-lg border bg-surface-card p-3.5 text-left transition-colors ${flag === f ? 'border-ink' : 'border-hairline-strong hover:border-body'}`}
          >
            <FlagBadge flag={f} />
            <div className="mt-1.5 text-[24px] font-semibold text-ink">{counts.byFlag[f]}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip on={priority === 'all'} onClick={() => setPriority('all')}>
          All priorities ({active.length})
        </Chip>
        {PRIORITIES.map((p) => (
          <Chip key={p} on={priority === p} onClick={() => setPriority(priority === p ? 'all' : p)}>
            {p} ({counts.byPriority[p]})
          </Chip>
        ))}
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as HotStage | 'active')}
          className="rounded-full border border-hairline-strong bg-surface-card px-3 py-1 text-[12.5px] text-body"
        >
          <option value="active">All active stages</option>
          {(Object.keys(STAGE_LABEL) as HotStage[]).map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto w-[260px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search company, contact, angle" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline-strong bg-surface-card">
        <div className="grid grid-cols-[92px_minmax(160px,1.1fr)_96px_140px_minmax(140px,1fr)_minmax(200px,1.6fr)_150px] gap-3 border-b border-hairline bg-canvas-soft px-4 py-2">
          <MicroLabel>Flag</MicroLabel>
          <MicroLabel>Company</MicroLabel>
          <MicroLabel>Priority</MicroLabel>
          <MicroLabel>Stage</MicroLabel>
          <MicroLabel>Contact</MicroLabel>
          <MicroLabel>Next question to earn the meeting</MicroLabel>
          <MicroLabel>Next touch</MicroLabel>
        </div>
        {visible.length === 0 && <p className="px-4 py-5 text-[13px] text-muted">Nothing matches these filters.</p>}
        {visible.map((e) => (
          <Row key={e.accountId} entry={e} today={today} open={open === e.accountId} onToggle={() => setOpen(open === e.accountId ? null : e.accountId)} />
        ))}
      </div>
    </div>
  );
}

const INLINE_SELECT = 'w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] hover:border-hairline-strong focus:border-ink focus:outline-none';

function Row({ entry: e, today, open, onToggle }: { entry: HotListEntry; today: string; open: boolean; onToggle: () => void }) {
  const [, startTransition] = useTransition();
  const save = (patch: Parameters<typeof updateHotListAction>[1]) => startTransition(() => updateHotListAction(e.accountId, patch));
  const flag = actionFlag(e.nextTouchDate, today);

  return (
    <div className="border-b border-hairline last:border-b-0">
      <div className="grid grid-cols-[92px_minmax(160px,1.1fr)_96px_140px_minmax(140px,1fr)_minmax(200px,1.6fr)_150px] items-center gap-3 px-4 py-2.5 text-[12.5px]">
        <button type="button" onClick={onToggle} className="text-left" aria-expanded={open}>
          <FlagBadge flag={flag} />
        </button>
        <div className="min-w-0">
          <Link href={`/calls?a=${e.accountId}`} className="block truncate text-[13.5px] font-medium text-ink hover:underline">
            {e.accountName}
          </Link>
          <button type="button" onClick={onToggle} className="text-[11.5px] text-text-link hover:underline">
            {open ? 'Hide details' : 'Details'}
          </button>
        </div>
        <select
          value={e.priority}
          onChange={(ev) => save({ priority: ev.target.value as HotPriority })}
          className={`${INLINE_SELECT} font-mono text-[11px] font-semibold ${PRIORITY_SELECT[e.priority]}`}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={e.stage} onChange={(ev) => save({ stage: ev.target.value as HotStage })} className={`${INLINE_SELECT} text-ink`}>
          {(Object.keys(STAGE_LABEL) as HotStage[]).map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <span className="truncate text-body" title={e.contact}>
          {e.contact || '—'}
        </span>
        <span className="leading-[1.45] text-ink">{e.nextQuestion || <span className="text-muted">—</span>}</span>
        <div className="flex flex-col gap-0.5">
          <select value={e.nextAction} onChange={(ev) => save({ nextAction: ev.target.value as NextAction })} className={`${INLINE_SELECT} text-ink`}>
            {(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((a) => (
              <option key={a} value={a}>
                {NEXT_ACTION_LABEL[a]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={e.nextTouchDate ?? ''}
            onChange={(ev) => save({ nextTouchDate: ev.target.value || null })}
            className={`${INLINE_SELECT} text-body`}
          />
        </div>
      </div>

      {open && (
        <div className="grid gap-x-6 gap-y-2.5 bg-canvas-soft px-4 py-3.5 text-[12.5px] leading-[1.55] sm:grid-cols-2">
          <Detail label="Why qualified in">{e.whyQualified}</Detail>
          <Detail label="Last meaningful interaction">{e.lastInteraction}</Detail>
          <Detail label="What I learned">{e.learned}</Detail>
          <Detail label="Current hypothesis">{e.hypothesis}</Detail>
          <Detail label="Angle">{e.angle}</Detail>
          <Detail label="Meeting to earn (15 min)">{e.meetingHypothesis}</Detail>
          {e.closeReason && <Detail label="Closed because">{e.closeReason}</Detail>}
          <div className="flex items-center gap-4 sm:col-span-2">
            <span className="text-muted">Last touch: {e.lastTouchAt ? new Date(e.lastTouchAt).toLocaleDateString() : 'none logged in Scout'}</span>
            <Link href={`/calls?a=${e.accountId}`} className="text-text-link hover:underline">
              Call →
            </Link>
            <Link href={`/emails?a=${e.accountId}`} className="text-text-link hover:underline">
              Email →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <MicroLabel>{label}</MicroLabel>
      <p className="mt-0.5 text-ink">{children}</p>
    </div>
  );
}
