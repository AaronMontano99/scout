'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, Check, ChevronLeft, ChevronRight, Ellipsis, MoveRight, Pencil, Plus, Sun, Trash2, UserRound, Zap } from 'lucide-react';
import { createTaskAction, deleteTaskAction, moveScheduleItemsAction, updateHotListAction, updateTaskAction } from '@/app/actions';
import { formatDayLabel, formatTime, isOverdue, monthGrid, nextMonday, parseYmd, weekOf, shiftDays, TASK_KIND_LABEL, type ScheduleItem } from '@/domain/schedule';
import { useShell } from '@/components/shell/shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { KIND_ICON, startHref } from './next-up';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Task vs Hot List touch, behind one set of moves. */
function useItemActions() {
  const { toast } = useShell();
  const [, startTransition] = useTransition();

  const moveTo = (item: ScheduleItem, date: string, today: string) =>
    startTransition(async () => {
      const previous = item.date;
      const write = (d: string) => (item.source === 'task' ? updateTaskAction(item.refId, { dueDate: d }) : updateHotListAction(item.refId, { nextTouchDate: d }));
      await write(date);
      toast(`Moved to ${formatDayLabel(date, today)}`, () => write(previous));
    });

  const complete = (item: ScheduleItem) =>
    startTransition(async () => {
      await updateTaskAction(item.refId, { doneAt: new Date().toISOString() });
      toast('Done', () => updateTaskAction(item.refId, { doneAt: null }));
    });

  const reopen = (item: ScheduleItem) => startTransition(() => updateTaskAction(item.refId, { doneAt: null }));

  const remove = (item: ScheduleItem) =>
    startTransition(async () => {
      const removed = await deleteTaskAction(item.refId);
      toast(`${item.title} deleted`, removed ? () => createTaskAction(removed) : undefined);
    });

  const moveAll = (list: ScheduleItem[], date: string) =>
    startTransition(async () => {
      const previous = list.map((i) => ({ source: i.source, refId: i.refId, date: i.date }));
      await moveScheduleItemsAction(list.map((i) => ({ source: i.source, refId: i.refId, date })));
      toast(`${list.length} moved to today`, () => moveScheduleItemsAction(previous));
    });

  return { moveTo, moveAll, complete, reopen, remove };
}

function ItemMenu({ item, today }: { item: ScheduleItem; today: string }) {
  const { open } = useShell();
  const router = useRouter();
  const actions = useItemActions();
  const [menu, setMenu] = useState(false);
  const [picking, setPicking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const row = 'flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[14px] hover:bg-surface-strong';
  const act = (fn: () => void) => () => {
    setMenu(false);
    setPicking(false);
    fn();
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={`More for ${item.title}`}
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => {
          setMenu(!menu);
          setPicking(false);
        }}
        className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong"
      >
        <Ellipsis size={16} />
      </button>
      {menu && (
        <div role="menu" className="glass-solid rise absolute right-0 z-20 mt-1.5 w-[220px] p-1.5">
          {picking ? (
            <div className="p-2">
              <Input aria-label="New date" type="date" defaultValue={item.date} onChange={(e) => e.target.value && act(() => actions.moveTo(item, e.target.value, today))()} className="!px-3 !py-2" />
            </div>
          ) : (
            <>
              <button type="button" role="menuitem" className={row} onClick={() => setPicking(true)}>
                <CalendarClock size={15} className="text-body" />
                Reschedule…
              </button>
              {item.date !== today && (
                <button type="button" role="menuitem" className={row} onClick={act(() => actions.moveTo(item, today, today))}>
                  <Sun size={15} className="text-body" />
                  Move to today
                </button>
              )}
              <button type="button" role="menuitem" className={row} onClick={act(() => actions.moveTo(item, nextMonday(today), today))}>
                <MoveRight size={15} className="text-body" />
                Move to next week
              </button>
              {item.source === 'task' && (
                <>
                  <button type="button" role="menuitem" className={row} onClick={act(() => actions.complete(item))}>
                    <Check size={15} className="text-body" />
                    Mark done
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={row}
                    onClick={act(() => open({ type: 'task', draft: { id: item.refId, accountId: item.accountId, title: item.title, kind: item.kind, dueDate: item.date, dueTime: item.time, notes: item.notes } }))}
                  >
                    <Pencil size={15} className="text-body" />
                    Edit
                  </button>
                </>
              )}
              {item.accountId && (
                <button type="button" role="menuitem" className={row} onClick={act(() => router.push(`/accounts/${item.accountId}`))}>
                  <UserRound size={15} className="text-body" />
                  Open account
                </button>
              )}
              {item.source === 'task' && (
                <>
                  <div className="my-1 border-t border-hairline" />
                  <button type="button" role="menuitem" className={`${row} text-bad`} onClick={act(() => actions.remove(item))}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AgendaRow({ item, today }: { item: ScheduleItem; today: string }) {
  const actions = useItemActions();
  const [done, setDone] = useState(item.done);
  const [saved, setSaved] = useState(item.done);
  if (saved !== item.done) {
    setSaved(item.done);
    setDone(item.done);
  }
  const Icon = KIND_ICON[item.kind];
  const href = startHref(item);
  return (
    <li className="well flex items-center gap-3 p-3">
      {item.source === 'task' ? (
        <input type="checkbox" aria-label={`Mark ${item.title} done`} checked={done} onChange={() => {
            setDone(!done);
            if (done) actions.reopen(item);
            else actions.complete(item);
          }} className="h-5 w-5 shrink-0 accent-[var(--accent)]" />
      ) : (
        <span className="grid h-5 w-5 shrink-0 place-items-center text-body">
          <Icon size={15} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {href ? (
          <Link href={href} className={`block truncate text-[14.5px] font-medium hover:underline ${done ? 'text-muted line-through' : ''}`}>
            {item.title}
          </Link>
        ) : (
          <p className={`truncate text-[14.5px] font-medium ${done ? 'text-muted line-through' : ''}`}>{item.title}</p>
        )}
        <p className="truncate text-[13px] text-body">
          {item.time ? `${formatTime(item.time)} · ` : ''}
          {TASK_KIND_LABEL[item.kind]}
          {item.source === 'touch' ? ' · Hot List' : item.accountName ? ` · ${item.accountName}` : ''}
          {isOverdue(item, today) ? ` · ${formatDayLabel(item.date, today)}` : ''}
        </p>
      </div>
      <ItemMenu item={item} today={today} />
    </li>
  );
}

function Dots({ items, selected }: { items: ScheduleItem[]; selected: boolean }) {
  if (items.length === 0) return null;
  return (
    <span className="flex items-center justify-center gap-[3px]" aria-hidden="true">
      {items.slice(0, 3).map((i) => (
        <span key={i.id} className={`h-[5px] w-[5px] rounded-full ${selected ? 'bg-on-primary' : i.kind === 'meeting' ? 'bg-primary' : 'bg-body'}`} />
      ))}
    </span>
  );
}

export function SchedulePage({ items, today }: { items: ScheduleItem[]; today: string }) {
  const { open } = useShell();
  const actions = useItemActions();
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const d = parseYmd(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const i of items) map.set(i.date, [...(map.get(i.date) ?? []), i]);
    return map;
  }, [items]);

  const overdue = items.filter((i) => isOverdue(i, today));
  const dayItems = byDay.get(selected) ?? [];
  const open7 = items.filter((i) => !i.done && i.date >= today && i.date <= shiftDays(today, 6)).length;
  const monthName = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const stepMonth = (n: number) => {
    const d = new Date(cursor.year, cursor.month + n, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };
  const goToday = () => {
    const d = parseYmd(today);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today);
  };

  const cell = (day: string, inMonth = true) => {
    const list = byDay.get(day) ?? [];
    const isSel = day === selected;
    const openCount = list.filter((i) => !i.done).length;
    return (
      <button
        key={day}
        type="button"
        onClick={() => setSelected(day)}
        aria-pressed={isSel}
        aria-label={`${parseYmd(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${openCount} open`}
        className={`flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-[12px] text-[14px] ${isSel ? 'bg-primary font-semibold text-on-primary' : day === today ? 'bg-surface-strong font-semibold text-ink' : inMonth ? 'text-ink hover:bg-surface-strong' : 'text-muted hover:bg-surface-strong'}`}
      >
        {parseYmd(day).getDate()}
        <Dots items={list.filter((i) => !i.done)} selected={isSel} />
      </button>
    );
  };

  return (
    <div className="rise flex flex-col gap-4">
      <PageHeader
        title="Schedule"
        subtitle={`${open7} open in the next 7 days. ${overdue.length} overdue. Hot List next touches show up here on their own.`}
        actions={
          <Button type="button" onClick={() => open({ type: 'task', draft: { dueDate: selected } })}>
            <Plus size={16} />
            New task
          </Button>
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="glass p-4 sm:p-5" aria-label="Calendar">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-[20px] font-medium">{monthName}</h2>
            <div className="flex gap-1 rounded-full bg-canvas-soft p-1" role="group" aria-label="Calendar view">
              {(['month', 'week'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize ${mode === m ? 'bg-surface-strong' : 'text-body hover:text-ink'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => stepMonth(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={goToday} className="rounded-full border border-hairline-strong px-4 py-1.5 text-[13.5px] font-medium hover:bg-surface-strong">
              Today
            </button>
            <button type="button" aria-label="Next month" onClick={() => stepMonth(1)} className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[13px] text-muted">
            {DAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {mode === 'month' ? monthGrid(cursor.year, cursor.month).flat().map((d) => cell(d, parseYmd(d).getMonth() === cursor.month)) : weekOf(selected).map((d) => cell(d))}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="glass flex flex-col gap-3 p-4 sm:p-5" aria-label="Selected day">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-medium">{formatDayLabel(selected, today)}</h2>
              <span className="text-[13.5px] text-body">
                {dayItems.filter((i) => i.done).length} of {dayItems.length} done
              </span>
            </div>
            {dayItems.length === 0 ? (
              <p className="text-[14px] text-body">Nothing on this day.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayItems.map((i) => (
                  <AgendaRow key={i.id} item={i} today={today} />
                ))}
              </ul>
            )}
          </section>

          {overdue.length > 0 && (
            <section className="glass flex flex-col gap-3 p-4 sm:p-5" aria-label="Overdue">
              <h2 className="flex items-center gap-2 text-[20px] font-medium">
                <Zap size={17} className="text-bad" />
                Overdue
                <span className="rounded-full bg-bad-soft px-2 py-0.5 font-sans text-[13px] font-medium text-bad">{overdue.length}</span>
                <button type="button" onClick={() => actions.moveAll(overdue, today)} className="ml-auto rounded-full border border-hairline-strong px-3.5 py-1.5 font-sans text-[13px] font-medium hover:bg-surface-strong">
                  Move all to today
                </button>
              </h2>
              <ul className="flex flex-col gap-2">
                {overdue.map((i) => (
                  <AgendaRow key={i.id} item={i} today={today} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
