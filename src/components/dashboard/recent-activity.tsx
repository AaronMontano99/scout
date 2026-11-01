import Link from 'next/link';
import { Footprints, Linkedin, Mail, Phone } from 'lucide-react';
import type { ActivityRecord } from '@/domain/day-summary';

const ICON = { call: Phone, email: Mail, walk_in: Footprints, linkedin: Linkedin };

const OUTCOME: Record<string, string> = {
  no_answer: 'No answer',
  voicemail: 'Left VM',
  gatekeeper: 'Gatekeeper',
  general_staff: 'Staff',
  decision_maker: 'Decision maker',
  other_executive: 'Executive',
  meeting_booked: 'Meeting booked',
  follow_up_required: 'Follow-up needed',
  not_interested: 'Not interested',
  wrong_contact: 'Wrong contact',
  connected: 'Connected',
  email_sent: 'Sent',
  email_reply: 'Reply',
};

export function outcomeText(a: ActivityRecord): string {
  return OUTCOME[a.outcome ?? ''] ?? 'Logged';
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentActivity({ activities, hideAccount = false }: { activities: ActivityRecord[]; hideAccount?: boolean }) {
  if (activities.length === 0) return <p className="text-[14px] text-body">Nothing logged yet.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {activities.map((a) => {
        const Icon = ICON[a.channel];
        return (
          <li key={a.id} className="flex items-start gap-3 text-[14px]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-strong text-body">
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1">
              {hideAccount || !a.accountId ? (
                <span className="block truncate font-medium">{outcomeText(a)}</span>
              ) : (
                <Link href={`/accounts/${a.accountId}`} className="block truncate font-medium hover:underline">
                  {a.accountName}
                </Link>
              )}
              <span className="block truncate text-[13px] text-body">{hideAccount ? (a.crmNotes[0] ?? a.contactName ?? '') : `${outcomeText(a)}${a.contactName ? `, ${a.contactName}` : ''}`}</span>
            </span>
            <span className="shrink-0 text-[13px] text-muted">{when(a.occurredAt)}</span>
          </li>
        );
      })}
    </ol>
  );
}
