'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { quickLogAction } from '@/app/actions';
import { OUTCOMES_BY_CHANNEL, OUTCOME_LABEL, outcomeFlags, type QuickOutcome } from '@/domain/quick-log';
import type { ActivityChannel } from '@/domain/day-summary';
import { addBusinessDays, ymd } from '@/domain/hot-list';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { FieldLabel, Sheet } from './sheet';
import { useShell, type LogDraft } from './shell';

const CHANNELS: { id: ActivityChannel; label: string }[] = [
  { id: 'call', label: 'Call' },
  { id: 'email', label: 'Email' },
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'linkedin', label: 'LinkedIn' },
];

/** Ten seconds, no AI run. This is what keeps every dashboard honest. */
export function LogSheet({ draft, onClose }: { draft?: LogDraft; onClose: () => void }) {
  const { accounts, toast } = useShell();
  const router = useRouter();
  const [company, setCompany] = useState(draft?.company ?? '');
  const [channel, setChannel] = useState<ActivityChannel>(draft?.channel ?? 'call');
  const [outcome, setOutcome] = useState<QuickOutcome>(draft?.outcome ?? OUTCOMES_BY_CHANNEL[draft?.channel ?? 'call'][0]!);
  const [contactName, setContactName] = useState(draft?.contactName ?? '');
  const [notes, setNotes] = useState('');
  const [relevant, setRelevant] = useState(false);
  const [meetingAsked, setMeetingAsked] = useState(false);
  const [meetingDate, setMeetingDate] = useState(() => addBusinessDays(ymd(new Date()), 1));
  const [meetingTime, setMeetingTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pickChannel = (c: ActivityChannel) => {
    setChannel(c);
    if (!OUTCOMES_BY_CHANNEL[c].includes(outcome)) setOutcome(OUTCOMES_BY_CHANNEL[c][0]!);
  };

  const flags = outcomeFlags(outcome);
  const talked = flags.decisionMaker && !flags.meetingBooked;

  const save = () => {
    if (!company.trim()) {
      setError('Which company?');
      return;
    }
    startTransition(async () => {
      const result = await quickLogAction({
        company,
        channel,
        outcome,
        contactName,
        notes,
        relevant: talked && relevant,
        meetingAsked: talked && meetingAsked,
        meetingDate: flags.meetingBooked ? meetingDate : null,
        meetingTime: flags.meetingBooked ? meetingTime : null,
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      toast(result.note ?? (flags.meetingBooked ? 'Meeting booked and on your Schedule' : 'Touch logged'));
      onClose();
      router.refresh();
    });
  };

  return (
    <Sheet
      title="Log a touch"
      subtitle="Counts toward your numbers right away. No AI run."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={pending} className="flex-[2] disabled:opacity-60">
            {pending ? 'Saving…' : 'Log it'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldLabel label="Company">
          <Input autoFocus={!draft?.company} list="scout-accounts" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Type a company. New names start an account." />
          <datalist id="scout-accounts">
            {accounts.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
        </FieldLabel>

        <div className="grid grid-cols-4 gap-1 rounded-full bg-canvas-soft p-1" role="group" aria-label="Channel">
          {CHANNELS.map((c) => (
            <button key={c.id} type="button" aria-pressed={channel === c.id} onClick={() => pickChannel(c.id)} className={`rounded-full py-2 text-[13px] font-medium ${channel === c.id ? 'bg-surface-strong text-ink' : 'text-body hover:text-ink'}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="What happened">
          {OUTCOMES_BY_CHANNEL[channel].map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(o)} className={`rounded-full px-3.5 py-2 text-[13.5px] font-medium ${outcome === o ? 'bg-primary text-on-primary' : 'bg-surface-strong text-body hover:text-ink'}`}>
              {OUTCOME_LABEL[o]}
            </button>
          ))}
        </div>

        {talked && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-body">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={relevant} onChange={(e) => setRelevant(e.target.checked)} />
              Real conversation
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={meetingAsked} onChange={(e) => setMeetingAsked(e.target.checked)} />
              Asked for the meeting
            </label>
          </div>
        )}

        {flags.meetingBooked && (
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Meeting date">
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </FieldLabel>
            <FieldLabel label="Time (optional)">
              <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
            </FieldLabel>
          </div>
        )}

        <FieldLabel label="Who (optional)">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name, title" />
        </FieldLabel>
        <FieldLabel label="Notes (optional)">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What you learned" />
        </FieldLabel>
        {error && <p className="text-[13px] text-bad">{error}</p>}
      </div>
    </Sheet>
  );
}
