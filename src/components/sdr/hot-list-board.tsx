'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, Mail, Phone } from 'lucide-react';
import { updateHotListAction, qualifyOutAction } from '@/app/actions';
import { STAGE_LABEL, actionFlag, isActive, sortHotList, type HotListEntry, type HotStage } from '@/domain/hot-list';
import { useShell } from '@/components/shell/shell';
import { Sheet, FieldLabel } from '@/components/shell/sheet';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { FlagBadge, HotListTable } from './hot-list-table';

const COLUMNS: HotStage[] = ['new_qi', 'developing', 'warm', 'meeting_ask_ready', 'meeting_booked'];
const LADDER: HotStage[] = ['new_qi', 'developing', 'warm', 'meeting_ask_ready', 'meeting_booked'];

export function HotListBoard({ entries, today }: { entries: HotListEntry[]; today: string }) {
  const { toast, open: openShell } = useShell();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<HotStage | null>(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortHotList(entries.filter((e) => !q || `${e.accountName} ${e.contact}`.toLowerCase().includes(q)), today);
  }, [entries, query, today]);

  const active = entries.filter((e) => isActive(e.stage));
  const due = active.filter((e) => actionFlag(e.nextTouchDate, today) === 'ACT NOW').length;
  const openEntry = entries.find((e) => e.accountId === openId) ?? null;

  const move = (entry: HotListEntry, stage: HotStage) => {
    if (entry.stage === stage) return;
    // A meeting has to be logged to count, so the board never books one silently.
    if (stage === 'meeting_booked') {
      setOpenId(null);
      openShell({ type: 'log', draft: { company: entry.accountName, outcome: 'meeting_booked', contactName: entry.contact } });
      return;
    }
    const previous = entry.stage;
    startTransition(async () => {
      await updateHotListAction(entry.accountId, { stage });
      toast(`${entry.accountName} moved to ${STAGE_LABEL[stage]}`, () => updateHotListAction(entry.accountId, { stage: previous }));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <p>
          <span className="block font-head text-[28px] font-medium">{active.length}</span>
          <span className="text-[13.5px] text-body">Active accounts</span>
        </p>
        <p>
          <span className="block font-head text-[28px] font-medium">{due}</span>
          <span className="text-[13.5px] text-body">Due or overdue</span>
        </p>
        <p>
          <span className="block font-head text-[28px] font-medium">{entries.filter((e) => e.stage === 'meeting_booked').length}</span>
          <span className="text-[13.5px] text-body">Meetings booked</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-canvas-soft p-1" role="group" aria-label="View">
          {(['board', 'list'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium capitalize ${view === v ? 'bg-surface-strong text-ink' : 'text-body hover:text-ink'}`}>
              {v}
            </button>
          ))}
        </div>
        {view === 'board' && (
          <div className="w-full sm:ml-auto sm:w-[280px]">
            <SearchInput value={query} onChange={setQuery} placeholder="Search company or contact" />
          </div>
        )}
      </div>

      {view === 'list' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            <HotListTable entries={entries} today={today} />
          </div>
        </div>
      ) : (
        <div className="scroll-x -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-5">
          {COLUMNS.map((stage) => {
            const cards = visible.filter((e) => e.stage === stage);
            return (
              <section
                key={stage}
                aria-label={STAGE_LABEL[stage]}
                data-stage={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(stage);
                }}
                onDragLeave={() => setOver((s) => (s === stage ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  const entry = entries.find((x) => x.accountId === dragging);
                  if (entry) move(entry, stage);
                  setDragging(null);
                }}
                className={`glass flex w-[272px] shrink-0 snap-start flex-col gap-2.5 p-3 xl:w-auto ${over === stage ? '!border-accent' : ''}`}
              >
                <h2 className="flex items-center gap-2 px-1 pt-1 font-sans text-[14px] font-medium">
                  <span className="stage-dot" />
                  {STAGE_LABEL[stage]}
                  <span className="ml-auto text-body">{cards.length}</span>
                </h2>
                {cards.length === 0 && <p className="px-1 pb-2 text-[13px] text-body">Drag an account here.</p>}
                {cards.map((e) => (
                  <article
                    key={e.accountId}
                    draggable
                    onDragStart={() => setDragging(e.accountId)}
                    onDragEnd={() => setDragging(null)}
                    data-stage={e.stage}
                    className={`stage-card group p-3.5 ${dragging === e.accountId ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <FlagBadge flag={actionFlag(e.nextTouchDate, today)} />
                      <GripVertical size={15} className="hidden text-body sm:block" aria-hidden="true" />
                    </div>
                    <button type="button" onClick={() => setOpenId(e.accountId)} className="mt-2 block w-full text-left">
                      <span className="block font-head text-[16px] leading-snug font-medium hover:underline">{e.accountName}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-body">{e.contact || 'No contact yet'}</span>
                    </button>
                    {e.nextQuestion && <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-body">{e.nextQuestion}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[13px] font-medium">{e.priority}</span>
                      <Link href={`/calls?a=${e.accountId}`} aria-label={`Call ${e.accountName}`} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
                        <Phone size={13} />
                      </Link>
                      <Link href={`/emails?a=${e.accountId}`} aria-label={`Email ${e.accountName}`} className="grid h-8 w-8 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
                        <Mail size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {openEntry && <EntrySheet entry={openEntry} today={today} onMove={(s) => move(openEntry, s)} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function EntrySheet({ entry: e, today, onMove, onClose }: { entry: HotListEntry; today: string; onMove: (stage: HotStage) => void; onClose: () => void }) {
  const { toast } = useShell();
  const [, startTransition] = useTransition();
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState('');
  const save = (patch: Parameters<typeof updateHotListAction>[1]) => startTransition(() => updateHotListAction(e.accountId, patch));
  const reached = LADDER.indexOf(e.stage);

  return (
    <Sheet title={e.accountName} subtitle={e.contact || 'No contact yet'} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex gap-0.5" role="group" aria-label="Stage">
          {LADDER.map((s, i) => (
            <button
              key={s}
              type="button"
              aria-pressed={e.stage === s}
              onClick={() => onMove(s)}
              title={STAGE_LABEL[s]}
              className={`chevron min-w-0 flex-1 truncate px-3 py-2.5 text-[12.5px] font-medium ${i <= reached ? 'bg-primary text-on-primary' : 'bg-surface-strong text-body hover:text-ink'}`}
            >
              {STAGE_LABEL[s].replace('Meeting ask ready', 'Ask ready').replace('Meeting booked', 'Booked')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <FlagBadge flag={actionFlag(e.nextTouchDate, today)} />
          <Link href={`/accounts/${e.accountId}`} className="ml-auto text-[13.5px] text-text-link hover:underline">
            Full account
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Next touch">
            <Input type="date" key={e.nextTouchDate} defaultValue={e.nextTouchDate ?? ''} onChange={(ev) => save({ nextTouchDate: ev.target.value || null })} />
          </FieldLabel>
          <FieldLabel label="Priority">
            <div className="flex gap-1 rounded-full bg-canvas-soft p-1">
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button key={p} type="button" aria-pressed={e.priority === p} onClick={() => save({ priority: p })} className={`flex-1 rounded-full py-1.5 text-[12.5px] font-medium ${e.priority === p ? 'bg-surface-strong text-ink' : 'text-body'}`}>
                  {p === 'MEDIUM' ? 'MED' : p}
                </button>
              ))}
            </div>
          </FieldLabel>
        </div>

        {[
          ['Next question to earn the meeting', e.nextQuestion],
          ['What I learned', e.learned],
          ['Last meaningful interaction', e.lastInteraction],
          ['Current hypothesis', e.hypothesis],
          ['Angle', e.angle],
          ['Meeting to earn (15 min)', e.meetingHypothesis],
          ['Why qualified in', e.whyQualified],
        ]
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label}>
              <p className="text-[13px] font-medium text-body">{label}</p>
              <p className="mt-0.5 text-[14px] leading-[1.55]">{value}</p>
            </div>
          ))}

        <div className="flex flex-wrap gap-2">
          <Link href={`/calls?a=${e.accountId}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-on-primary hover:bg-primary-active">
            <Phone size={15} />
            Call
          </Link>
          <Link href={`/emails?a=${e.accountId}`} className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[14px] font-medium hover:bg-surface-strong">
            <Mail size={15} />
            Email
          </Link>
          <button type="button" onClick={() => setClosing(!closing)} className="rounded-full border border-hairline-strong px-4 py-2 text-[14px] font-medium hover:bg-surface-strong">
            Close out
          </button>
        </div>

        {closing && (
          <div className="flex flex-col gap-2">
            <Textarea rows={2} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="Why is it out? e.g. centralized at corporate, no local authority" />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                startTransition(async () => {
                  await qualifyOutAction(e.accountId, reason);
                  toast(`${e.accountName} closed out`, () => updateHotListAction(e.accountId, { stage: e.stage, priority: e.priority, closeReason: '' }));
                  onClose();
                })
              }
            >
              Qualify out
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
