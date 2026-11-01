'use client';

import { Plus } from 'lucide-react';
import type { ScheduleItem } from '@/domain/schedule';
import { useShell } from '@/components/shell/shell';
import { NextUpList } from './next-up';
import { Panel } from './stat';

export function AccountTasks({ accountId, items, today }: { accountId: string; items: ScheduleItem[]; today: string }) {
  const { open } = useShell();
  const upcoming = items.filter((i) => !i.done);
  return (
    <Panel
      title="Tasks"
      action={
        <button type="button" aria-label="Add a task" onClick={() => open({ type: 'task', draft: { accountId } })} className="grid h-9 w-9 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
          <Plus size={16} />
        </button>
      }
    >
      {upcoming.length === 0 ? <p className="text-[14px] text-body">Nothing scheduled for this account.</p> : <NextUpList items={upcoming} today={today} />}
    </Panel>
  );
}
