import Link from 'next/link';
import { getOrCreateSellerStyleProfile } from '@/data/seller-style';
import {
  updateToneNotesAction,
  addStyleRuleAction,
  removeStyleRuleAction,
  addPhraseToAvoidAction,
  removePhraseToAvoidAction,
  addStyleExampleAction,
  removeStyleExampleAction,
} from './actions';
import { Textarea, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';
import type { SampleKind } from '@/data/seller-style';

// Persistent Seller Style Memory — see docs/SELLER_STYLE.md. Once
// taught here, every call script/voicemail/email generation
// automatically picks this up (src/ai/seller-voice/) — the rep never
// has to remind Scout again.

const SAMPLE_SECTIONS: { kind: SampleKind; label: string; placeholder: string }[] = [
  { kind: 'sampleScripts', label: 'Call Scripts', placeholder: "Hi, this is Aaron with Pacific Office Automation. Reason for my call..." },
  { kind: 'sampleEmails', label: 'Emails', placeholder: 'Hi Ryan, happy Friday!...' },
  { kind: 'sampleVoicemails', label: 'Voicemails', placeholder: "Hey, this is Aaron with... my number's..." },
];

function RemovableChip({ label, action }: { label: string; action: () => Promise<void> }) {
  return (
    <form action={action} className="inline-flex items-center gap-1.5 rounded-full bg-surface-strong py-1 pr-1 pl-3 text-[12.5px] text-ink">
      <span>{label}</span>
      <button type="submit" aria-label={`Remove ${label}`} className="rounded-full px-1.5 text-muted hover:bg-canvas hover:text-ink">
        ✕
      </button>
    </form>
  );
}

export default async function SellerStylePage() {
  const profile = getOrCreateSellerStyleProfile();

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <div className="text-xs text-muted">
        <Link href="/app/settings" className="hover:text-ink">
          Settings
        </Link>{' '}
        / Seller Style
      </div>
      <PageHeader
        title="Seller Style"
        subtitle="How you communicate — taught once, remembered for every call script, voicemail, and email Scout generates for you."
      />

      <Panel className="p-[18px_20px]">
        <div className="text-[15px] font-semibold text-ink">Tone</div>
        <p className="mt-1 text-[12.5px] text-body">A few sentences describing your overall voice. Free text — Scout&apos;s default voice is used until you set this.</p>
        <form action={updateToneNotesAction} className="mt-3.5">
          <Textarea name="toneNotes" defaultValue={profile.toneNotes ?? ''} rows={3} placeholder="Direct, conversational, no corporate buzzwords. Short sentences." />
          <Button type="submit" className="mt-2.5">
            Save Tone
          </Button>
        </form>
      </Panel>

      <Panel className="p-[18px_20px]">
        <div className="text-[15px] font-semibold text-ink">Explicit Rules</div>
        <p className="mt-1 text-[12.5px] text-body">Durable rules Scout always follows once you&apos;ve said them, e.g. &ldquo;Never use dashes&rdquo; or &ldquo;Always offer two specific meeting times.&rdquo;</p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {profile.styleRules.rules.length === 0 ? (
            <p className="text-[12.5px] text-muted">No explicit rules yet — Scout&apos;s default voice rules apply.</p>
          ) : (
            profile.styleRules.rules.map((rule) => (
              <RemovableChip key={rule} label={rule} action={removeStyleRuleAction.bind(null, rule)} />
            ))
          )}
        </div>
        <form action={addStyleRuleAction} className="mt-3 flex gap-2">
          <div className="flex-1">
            <Input name="rule" placeholder='e.g. "Keep emails under 100 words"' />
          </div>
          <Button type="submit" variant="secondary">
            Add Rule
          </Button>
        </form>
      </Panel>

      <Panel className="p-[18px_20px]">
        <div className="text-[15px] font-semibold text-ink">Phrases to Avoid</div>
        <p className="mt-1 text-[12.5px] text-body">Specific words or phrases Scout will never use for you, on top of the default banned list (jargon, AI filler, cold-call disclaimers).</p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {profile.styleRules.phrasesToAvoid.length === 0 ? (
            <p className="text-[12.5px] text-muted">None saved yet.</p>
          ) : (
            profile.styleRules.phrasesToAvoid.map((phrase) => (
              <RemovableChip key={phrase} label={phrase} action={removePhraseToAvoidAction.bind(null, phrase)} />
            ))
          )}
        </div>
        <form action={addPhraseToAvoidAction} className="mt-3 flex gap-2">
          <div className="flex-1">
            <Input name="phrase" placeholder='e.g. "circle back"' />
          </div>
          <Button type="submit" variant="secondary">
            Add Phrase
          </Button>
        </form>
      </Panel>

      {SAMPLE_SECTIONS.map((section) => (
        <Panel key={section.kind} className="p-[18px_20px]">
          <div className="text-[15px] font-semibold text-ink">Example {section.label}</div>
          <p className="mt-1 text-[12.5px] text-body">Paste a real {section.label.toLowerCase()} you&apos;d actually send — Scout matches this voice closely.</p>
          <div className="mt-3.5 flex flex-col gap-2">
            {profile[section.kind].length === 0 ? (
              <p className="text-[12.5px] text-muted">No examples saved yet.</p>
            ) : (
              profile[section.kind].map((example) => (
                <div key={example} className="flex items-start justify-between gap-3 rounded-md border border-hairline-strong bg-canvas-soft p-3">
                  <p className="text-[13px] leading-[1.5] text-ink">{example}</p>
                  <form action={removeStyleExampleAction.bind(null, section.kind, example)}>
                    <button type="submit" className="shrink-0 text-xs text-muted hover:text-semantic-error">
                      Remove
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
          <form action={addStyleExampleAction.bind(null, section.kind)} className="mt-3 flex flex-col gap-2">
            <Textarea name="example" rows={2} placeholder={section.placeholder} />
            <Button type="submit" variant="secondary" className="self-start">
              Add Example
            </Button>
          </form>
        </Panel>
      ))}
    </div>
  );
}
