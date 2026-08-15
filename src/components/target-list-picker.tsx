import Link from 'next/link';
import type { TargetList } from '@/types/product';
import type { TargetListProgress } from '@/domain/target-lists';
import { MicroLabel } from './ui/micro-label';
import { Panel } from './ui/panel';
import { ProgressBar } from './ui/progress-bar';

export interface ListPickerEntry {
  list: TargetList;
  progress: TargetListProgress;
}

// Left-hand "YOUR LISTS" picker — matches scout-ui.html's Lists screen:
// 304px panel, left accent bar on the selected row, progress bar +
// research focus + last-worked meta per row.

export function TargetListPicker({ entries, activeId }: { entries: ListPickerEntry[]; activeId: string }) {
  return (
    <Panel className="w-[304px] shrink-0 overflow-hidden">
      <div className="border-b border-hairline px-4 py-3">
        <MicroLabel>Your Lists</MicroLabel>
      </div>
      {entries.map(({ list, progress }) => {
        const active = list.id === activeId;
        const pct = progress.total > 0 ? Math.round((progress.worked / progress.total) * 100) : 0;
        return (
          <Link
            key={list.id}
            href={`/app/lists/${list.id}`}
            className={`block border-b border-hairline px-4 py-3.5 ${active ? 'border-l-2 border-l-text-link bg-[#EEF6FF]' : 'border-l-2 border-l-transparent hover:bg-canvas-soft'}`}
          >
            <span className="block text-[13.5px] font-medium text-ink">{list.name}</span>
            <span className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.06em] text-body">
                {progress.worked}/{progress.total} WORKED
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-hairline-strong" />
              <span className="text-[11.5px] text-muted">{list.researchFocus ?? 'General'}</span>
            </span>
            <span className="mt-2 block">
              <ProgressBar value={pct} max={100} />
            </span>
            <span className="mt-2 block text-[11.5px] text-muted">
              {list.lastWorkedAt ? `Last worked ${new Date(list.lastWorkedAt).toLocaleDateString()}` : 'Not worked yet'}
            </span>
          </Link>
        );
      })}
      <div className="px-4 py-3.5">
        <Link href="/app/lists/new" className="text-[12.5px] text-text-link hover:underline">
          + New list
        </Link>
      </div>
    </Panel>
  );
}
