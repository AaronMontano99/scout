'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Check, Footprints, Linkedin, ListTodo, Mail, Phone, Search, Users } from 'lucide-react';
import { updateTaskAction } from '@/app/actions';
import { formatDayLabel, formatTime, type ScheduleItem, type TaskKind } from '@/domain/schedule';
import { useShell } from '@/components/shell/shell';

export const KIND_ICON: Record<TaskKind, typeof Phone> = { call: Phone, email: Mail, walk_in: Footprints, linkedin: Linkedin, meeting: Users, research: Search, task: ListTodo };

export function startHref(item: ScheduleItem): string | null {
  if (!item.accountId) return null;
  if (item.kind === 'email') return `/emails?a=${item.accountId}`;
  if (item.kind === 'call') return `/calls?a=${item.accountId}`;
  return `/accounts/${item.accountId}`;
}

export function NextUpList({ items, today }: { items: ScheduleItem[]; today: string }) {
  const { toast } = useShell();
  const [, startTransition] = useTransition();

  if (items.length === 0) return <p className="text-[14px] text-body">Nothing due. Good time to find new accounts on the Calls tab.</p>;

  return (
    <ul className="flex flex-col gap-1">
      {items.map((i) => {
        const Icon = KIND_ICON[i.kind];
        const overdue = i.date < today;
        const href = startHref(i);
        return (
          <li key={i.id} className="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-surface-strong">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-strong text-body">
              <Icon size={15} />
            </span>
            <span className="min-w-0 flex-1">
              {href ? (
                <Link href={href} className="block truncate text-[14px] font-medium hover:underline">
                  {i.title}
                </Link>
              ) : (
                <span className="block truncate text-[14px] font-medium">{i.title}</span>
              )}
              <span className={`block truncate text-[13px] ${overdue ? 'text-bad' : 'text-body'}`}>
                {overdue ? 'Overdue, ' : ''}
                {formatDayLabel(i.date, today)}
                {i.time ? ` ${formatTime(i.time)}` : ''}
                {i.priority ? ` · ${i.priority}` : ''}
              </span>
            </span>
            {i.source === 'task' && (
              <button
                type="button"
                aria-label={`Mark ${i.title} done`}
                onClick={() =>
                  startTransition(async () => {
                    await updateTaskAction(i.refId, { doneAt: new Date().toISOString() });
                    toast('Done', () => updateTaskAction(i.refId, { doneAt: null }));
                  })
                }
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline-strong hover:bg-primary hover:text-on-primary"
              >
                <Check size={15} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
