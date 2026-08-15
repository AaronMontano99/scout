'use client';

import { useState } from 'react';
import type { CallOutcomeType, Contact } from '@/types/product';
import { logCallAction } from '@/app/app/accounts/[id]/post-call/actions';
import { Textarea, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CertaintyBadge } from '@/components/badges';

const OUTCOME_GROUPS: { label: string; options: { id: CallOutcomeType; label: string }[] }[] = [
  {
    label: 'No contact made',
    options: [
      { id: 'no_answer', label: 'No Answer' },
      { id: 'voicemail', label: 'Voicemail Left' },
      { id: 'wrong_contact', label: 'Wrong Contact' },
    ],
  },
  {
    label: 'Who you reached',
    options: [
      { id: 'gatekeeper', label: 'Gatekeeper' },
      { id: 'general_staff', label: 'General Staff' },
      { id: 'influencer', label: 'Influencer' },
      { id: 'champion', label: 'Champion' },
      { id: 'decision_maker', label: 'Decision Maker' },
      { id: 'other_executive', label: 'Other Executive' },
    ],
  },
  {
    label: 'Result',
    options: [
      { id: 'connected', label: 'Connected' },
      { id: 'meeting_booked', label: 'Meeting Booked' },
      { id: 'follow_up_required', label: 'Follow-Up Required' },
      { id: 'not_interested', label: 'Not Interested' },
    ],
  },
];

export function LogCallForm({ accountId, contacts }: { accountId: string; contacts: Contact[] }) {
  const [outcomeType, setOutcomeType] = useState<CallOutcomeType | null>(null);
  const [contactId, setContactId] = useState('');
  const [contactRoleObserved, setContactRoleObserved] = useState('');
  const [currentVendor, setCurrentVendor] = useState('');
  const [timingMentioned, setTimingMentioned] = useState('');
  const [notes, setNotes] = useState('');
  const [phase, setPhase] = useState<'edit' | 'review'>('edit');

  const proposed = [
    contactRoleObserved && `Contact role observed: ${contactRoleObserved}`,
    currentVendor && `Possible incumbent vendor: ${currentVendor}`,
    timingMentioned && `Timing mentioned: ${timingMentioned}`,
    notes && `Call note: ${notes}`,
  ].filter((x): x is string => Boolean(x));

  const action = logCallAction.bind(null, accountId);

  return (
    <form action={action} className="flex flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-card p-6">
      <input type="hidden" name="outcomeType" value={outcomeType ?? ''} />
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="contactRoleObserved" value={contactRoleObserved} />
      <input type="hidden" name="currentVendor" value={currentVendor} />
      <input type="hidden" name="timingMentioned" value={timingMentioned} />
      <input type="hidden" name="notes" value={notes} />

      {phase === 'edit' ? (
        <>
          {OUTCOME_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{group.label}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutcomeType(opt.id)}
                    aria-pressed={outcomeType === opt.id}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      outcomeType === opt.id ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {contacts.length > 0 && (
            <label className="flex flex-col gap-1 text-sm text-body">
              Spoke with
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="rounded-md border border-hairline-strong bg-surface-card px-4 py-3 text-sm text-ink"
              >
                <option value="">Not on file</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm text-body">
            Notes — type it however you&apos;d say it
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-body">
              Contact role observed
              <Input value={contactRoleObserved} onChange={(e) => setContactRoleObserved(e.target.value)} placeholder="e.g. Reports to IT Director" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Current vendor mentioned
              <Input value={currentVendor} onChange={(e) => setCurrentVendor(e.target.value)} placeholder="e.g. Competitor Co" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Timing mentioned
              <Input value={timingMentioned} onChange={(e) => setTimingMentioned(e.target.value)} placeholder="e.g. Renewal in Q3" />
            </label>
          </div>

          <Button
            type="button"
            disabled={!outcomeType}
            onClick={() => setPhase('review')}
            className="self-start disabled:opacity-50"
          >
            Review What Scout Will Save
          </Button>
        </>
      ) : (
        <>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Scout will save</div>
            <ul className="mt-2 flex flex-col gap-2">
              <li className="text-sm text-body">
                Call outcome: <span className="font-medium text-ink">{outcomeType}</span>
              </li>
              {proposed.length === 0 ? (
                <li className="text-sm text-muted">No additional account memory — just the call outcome.</li>
              ) : (
                proposed.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <CertaintyBadge certainty="INFERRED" />
                    <span className="text-body">{p}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Approve and Save to Account Memory</Button>
            <Button type="button" variant="secondary" onClick={() => setPhase('edit')}>
              ← Back to Edit
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
