'use client';

import { useState, useTransition } from 'react';
import type { Debrief, HotListUpdate } from '@/ai/sdr/schemas';
import type { ActivityChannel } from '@/domain/day-summary';
import { quickLogCallAction, saveDebriefAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { MicroLabel } from '@/components/ui/micro-label';
import { AiProgress, CopyButton, ErrorNote, Field, useSdrRequest } from './shared';
import { HotListProposal } from './hot-list-proposal';

const CHANNELS: { id: ActivityChannel; label: string }[] = [
  { id: 'call', label: 'Call' },
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'email', label: 'Email reply' },
];

const FUNNEL_FLAGS: { key: keyof Debrief['funnel']; label: string }[] = [
  { key: 'connected', label: 'Connected' },
  { key: 'decisionMaker', label: 'DM conversation' },
  { key: 'relevantConversation', label: 'Relevant conversation' },
  { key: 'meetingAsked', label: 'Asked for meeting' },
  { key: 'meetingBooked', label: 'Meeting booked' },
];

export function DebriefPanel({
  accountId,
  targetName,
  defaultChannel = 'call',
}: {
  accountId: string;
  targetName: string | null;
  defaultChannel?: ActivityChannel;
}) {
  const [channel, setChannel] = useState<ActivityChannel>(defaultChannel);
  const [notes, setNotes] = useState('');
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [funnel, setFunnel] = useState<Debrief['funnel'] | null>(null);
  const [category, setCategory] = useState<'prospecting' | 'admin'>('prospecting');
  const [hotList, setHotList] = useState<HotListUpdate | null>(null);
  const [applyHot, setApplyHot] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const { run, pending, elapsed, error } = useSdrRequest<Debrief>(`coach:${accountId}`);

  const coach = async () => {
    if (!notes.trim()) return;
    setSaved(null);
    const result = await run({ action: 'coach', accountId, notes: notes.trim(), channel });
    if (result) {
      setDebrief(result);
      setFunnel(result.funnel);
      setCategory(result.category);
      setHotList(result.hotList);
      setApplyHot(result.hotList.decision !== 'not_qualified');
    }
  };

  const save = () => {
    if (!debrief || !funnel) return;
    startSaving(async () => {
      await saveDebriefAction(accountId, { channel, rawNotes: notes.trim(), debrief, funnel, category, hotList: applyHot ? hotList : null });
      setSaved('Saved to the account and today’s numbers.');
    });
  };

  const [noPickup, setNoPickup] = useState<{ nextMove: string; trackerLine: string } | null>(null);
  const quickLog = (outcome: 'no_answer' | 'voicemail') => {
    startSaving(async () => {
      const result = await quickLogCallAction(accountId, outcome, targetName ?? undefined);
      setNoPickup(result);
      setSaved(outcome === 'voicemail' ? 'VM logged.' : 'No answer logged.');
    });
  };

  const reset = () => {
    setNoPickup(null);
    setNotes('');
    setDebrief(null);
    setFunnel(null);
    setSaved(null);
  };

  const crmText = debrief
    ? [...debrief.crmNotes.map((n) => `- ${n}`), debrief.status && `Status: ${debrief.status}`, debrief.crmNextStep && `Next Step: ${debrief.crmNextStep}`]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            aria-pressed={channel === c.id}
            className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${
              channel === c.id ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        ))}
        {channel === 'call' && (
          <span className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={() => quickLog('no_answer')} className="!px-3 !py-1.5 !text-[12.5px]">
              No answer
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => quickLog('voicemail')} className="!px-3 !py-1.5 !text-[12.5px]">
              Left VM
            </Button>
          </span>
        )}
      </div>

      <label className="flex flex-col gap-1 text-[12px] text-body">
        Your notes, however you&apos;d type them
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder={'Spoke to Omar at the front desk\n> security handled through the landlord\n> vendor decisions centralized at the parent company\n> TT the GM. No local decisions.'}
        />
      </label>
      <div className="flex items-center gap-2">
        <Button type="button" disabled={pending || !notes.trim()} onClick={coach} className="disabled:opacity-50">
          Coach me + write CRM notes
        </Button>
        {(debrief || saved) && (
          <Button type="button" variant="secondary" onClick={reset}>
            Log another
          </Button>
        )}
      </div>

      {saved && !debrief && (
        <div className="flex flex-col gap-1.5 rounded-md bg-good-soft px-4 py-3 text-[13px] text-good">
          <span>{saved}</span>
          {noPickup && (
            <>
              <span className="text-ink">
                <span className="font-medium">Next move: </span>
                {noPickup.nextMove}
              </span>
              <span className="flex items-center gap-3 font-mono text-[12px] text-body">
                {noPickup.trackerLine}
                <CopyButton text={noPickup.trackerLine} />
              </span>
            </>
          )}
        </div>
      )}
      {pending && <AiProgress label="Reading your notes like a sales manager would…" elapsed={elapsed} />}
      {!pending && error && <ErrorNote message={error} onRetry={coach} />}

      {debrief && funnel && !pending && (
        <div className="flex flex-col gap-4 border-t border-hairline pt-4">
          <Field label="What happened">{debrief.whatHappened}</Field>
          {debrief.whatILearned.length > 0 && (
            <div>
              <MicroLabel>What you learned</MicroLabel>
              <ul className="mt-1 flex flex-col gap-1 text-[13.5px] text-ink">
                {debrief.whatILearned.map((l) => (
                  <li key={l}>· {l}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meeting opportunity">{debrief.meetingOpportunity}</Field>
            <Field label="Did you ask?">{debrief.didIAsk}</Field>
          </div>
          <Field label="Where you lost control">{debrief.whereILostControl}</Field>
          <Field label="Better question" emphasis>
            {debrief.betterQuestion}
          </Field>
          <Field label="Better meeting bridge">{debrief.betterMeetingBridge}</Field>
          <Field label="Next step" emphasis>
            {debrief.nextStep}
          </Field>

          <div className="rounded-md border border-hairline-strong p-4">
            <div className="flex items-center justify-between">
              <MicroLabel>CRM notes</MicroLabel>
              <CopyButton text={crmText} />
            </div>
            <pre className="mt-1.5 font-sans text-[13.5px] leading-[1.6] whitespace-pre-wrap text-ink">{crmText}</pre>
          </div>

          {debrief.followUpEmail.body && (
            <div className="rounded-md border border-hairline-strong p-4">
              <div className="flex items-center justify-between">
                <MicroLabel>Post-call email</MicroLabel>
                <CopyButton text={`Subject: ${debrief.followUpEmail.subject}\n\n${debrief.followUpEmail.body}`} />
              </div>
              <p className="mt-1.5 text-[13.5px] font-medium text-ink">{debrief.followUpEmail.subject}</p>
              <pre className="mt-1 font-sans text-[13.5px] leading-[1.6] whitespace-pre-wrap text-ink">{debrief.followUpEmail.body}</pre>
            </div>
          )}

          {hotList && <HotListProposal update={hotList} onChange={setHotList} apply={applyHot} onApplyChange={setApplyHot} />}

          <div className="flex flex-col gap-2 rounded-md bg-canvas-soft p-4">
            <MicroLabel>Confirm what counts (tap to change)</MicroLabel>
            <div className="flex flex-wrap gap-1.5">
              {FUNNEL_FLAGS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFunnel({ ...funnel, [f.key]: !funnel[f.key] })}
                  aria-pressed={funnel[f.key]}
                  className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${
                    funnel[f.key] ? 'bg-ink text-canvas' : 'border border-hairline-strong bg-surface-card text-muted'
                  }`}
                >
                  {funnel[f.key] ? '✓ ' : ''}
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory(category === 'prospecting' ? 'admin' : 'prospecting')}
                className="ml-auto rounded-full border border-hairline-strong bg-surface-card px-3 py-1 text-[12.5px] text-body"
              >
                {category === 'prospecting' ? 'Prospecting' : 'Admin / customer service'}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <Button type="button" disabled={saving || Boolean(saved)} onClick={save} className="disabled:opacity-60">
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save to Ferret'}
              </Button>
              {saved && <span className="text-[13px] text-good">{saved}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
