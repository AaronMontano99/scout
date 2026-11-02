'use client';

import { useTransition } from 'react';
import { deleteActivityAction } from '@/app/actions';
import type { ActivityRecord } from '@/domain/day-summary';
import { MicroLabel } from '@/components/ui/micro-label';
import { CopyButton } from './shared';

const CHANNEL_LABEL: Record<string, string> = { call: 'Call', email: 'Email', walk_in: 'Walk-in', linkedin: 'LinkedIn' };

export function ActivityList({ activities, showAccount = false, title = 'Activity' }: { activities: ActivityRecord[]; showAccount?: boolean; title?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3 glass p-4">
      <MicroLabel>{title}</MicroLabel>
      {activities.length === 0 && <p className="text-[12.5px] text-muted">Nothing logged yet.</p>}
      {activities.map((a) => {
        const when = new Date(a.occurredAt);
        const crmText = a.crmNotes.map((n) => `- ${n}`).join('\n');
        return (
          <div key={a.id} className="group border-t border-hairline pt-2.5 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="font-medium text-ink">
                {showAccount ? `${a.accountName} · ` : ''}
                {CHANNEL_LABEL[a.channel]}
              </span>
              <span className="text-muted" suppressHydrationWarning>
                {when.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}{' '}
                {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
              {a.meetingBooked && <span className="rounded-full bg-good-soft px-2 py-px text-[12px] font-medium text-good">Meeting booked</span>}
              {a.category === 'admin' && <span className="rounded-full bg-surface-strong px-2 py-px text-[12px] text-muted">Admin</span>}
              <span className="ml-auto flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                {crmText && <CopyButton text={crmText} label="Copy" />}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm('Delete this logged activity? It will no longer count toward your numbers.')) {
                      startTransition(() => deleteActivityAction(a.id));
                    }
                  }}
                  className="text-[12px] text-muted hover:text-ink"
                >
                  Delete
                </button>
              </span>
            </div>
            {a.crmNotes.length > 0 && (
              <ul className="mt-1 flex flex-col gap-0.5">
                {a.crmNotes.map((n, i) => (
                  <li key={i} className="text-[12.5px] leading-[1.5] text-body">
                    · {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
