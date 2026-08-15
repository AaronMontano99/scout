/**
 * Central prompt composition — the ONE place that assembles a seller-
 * voice system+user prompt pair. Every generation function in
 * generate.ts calls this; nothing else in the codebase should build
 * its own seller-voice prompt string. See docs/SELLER_STYLE.md's
 * style hierarchy (master prompt Phase 26):
 *
 *   1. current explicit user instruction (this request only)
 *   2. saved Seller Style Profile
 *   3. organization rules (thin in local mode — no compliance/approved-
 *      language system exists; "what you sell" acts as loose guidance)
 *   4. Scout's default seller voice (the fallback for a new/untaught rep)
 */
import { DEFAULT_SELLER_STYLE_PROMPT } from './default-style';
import type { StyleRules } from '@/data/seller-style';
import type { WorkspaceSettings } from '@/data/settings';
import type { SellerStyleProfile } from '@/types/product';
import type { AccountAngle, ContactInfo, RepInfo } from './context';

export type CommunicationType = 'call_script' | 'voicemail' | 'email' | 'post_call_followup';

const TYPE_LABEL: Record<CommunicationType, string> = {
  call_script: 'a cold-call script',
  voicemail: 'a voicemail script',
  email: 'a prospecting email',
  post_call_followup: 'a post-call follow-up email',
};

const SAMPLE_KEY_FOR_TYPE: Partial<Record<CommunicationType, keyof SellerStyleProfile>> = {
  call_script: 'sampleScripts',
  voicemail: 'sampleVoicemails',
  email: 'sampleEmails',
  post_call_followup: 'sampleEmails',
};

export interface ComposeInput {
  communicationType: CommunicationType;
  account: { name: string; domain: string | null; industry: string | null } & AccountAngle;
  contact: ContactInfo | null;
  rep: RepInfo;
  meetingTimes?: string[];
  callOutcome?: { outcomeType: string; notes: string | null };
  /** One-time instruction for THIS request only — never persisted here. See seller-style.ts's addStyleRule for the "remember this" path. */
  explicitInstruction?: string;
  sellerStyle: SellerStyleProfile & { styleRules: StyleRules };
  orgSettings: Pick<WorkspaceSettings, 'whatYouSell' | 'idealBuyerRoles' | 'callStyle'>;
}

/** Real sample(s) for this exact type, falling back to sampleScripts for voicemail (same pitch, different medium) when the rep hasn't taught one yet. */
function resolveSamples(input: ComposeInput): { samples: string[]; fallbackNote: string } {
  const style = input.sellerStyle;
  const sampleKey = SAMPLE_KEY_FOR_TYPE[input.communicationType];
  const direct = sampleKey ? (style[sampleKey] as string[] | undefined) : undefined;
  if (direct && direct.length > 0) return { samples: direct, fallbackNote: '' };
  if (input.communicationType === 'voicemail' && style.sampleScripts.length > 0) {
    return {
      samples: style.sampleScripts,
      fallbackNote: ' (no voicemail example saved yet — these are the real call scripts this rep writes; adapt the same opening and pacing for a message left on an answering machine)',
    };
  }
  return { samples: [], fallbackNote: '' };
}

function buildSystemPrompt(input: ComposeInput): string {
  const sections: string[] = [];
  const hasSamples = resolveSamples(input).samples.length > 0;

  sections.push(
    [
      `You are helping a real B2B salesperson write ${TYPE_LABEL[input.communicationType]}. Write ONLY the communication itself — no preamble like "Here is..." or "Sure, here's...", no meta-commentary, no explanation. Just the message.`,
      hasSamples &&
        'This rep has taught Scout real examples of their own writing, included below — that is the actual voice to write in. Everything else in this prompt is background context; the real example is the template.',
    ]
      .filter(Boolean)
      .join(' ')
  );

  sections.push(`--- SCOUT'S DEFAULT SELLER VOICE (fallback — the rep's own saved style below always wins where they conflict) ---\n${DEFAULT_SELLER_STYLE_PROMPT}`);

  const org = input.orgSettings;
  if (org.whatYouSell || org.idealBuyerRoles || org.callStyle) {
    sections.push(
      [
        '--- WORKSPACE CONTEXT ---',
        org.whatYouSell && `What we sell: ${org.whatYouSell}`,
        org.idealBuyerRoles && `Typical buyer roles: ${org.idealBuyerRoles}`,
        org.callStyle && `Preferred call style: ${org.callStyle}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const style = input.sellerStyle;
  const hasSavedStyle = style.toneNotes || style.styleRules.rules.length > 0 || style.styleRules.phrasesToAvoid.length > 0;
  if (hasSavedStyle) {
    const parts = [
      '--- THIS REP\'S SAVED STYLE (overrides the default voice above wherever they conflict) ---',
      style.toneNotes && `Tone: ${style.toneNotes}`,
      style.styleRules.rules.length > 0 && `Explicit rules the rep has set, always follow these:\n${style.styleRules.rules.map((r) => `- ${r}`).join('\n')}`,
      style.styleRules.phrasesToAvoid.length > 0 && `Never use these phrases: ${style.styleRules.phrasesToAvoid.join(', ')}`,
    ].filter(Boolean);
    sections.push(parts.join('\n'));
  }

  const { samples, fallbackNote: sampleFallbackNote } = resolveSamples(input);
  if (samples.length > 0) {
    sections.push(
      [
        `--- THIS IS LITERALLY HOW THE REP WRITES — NOT A TONE REFERENCE, A TEMPLATE${sampleFallbackNote} ---`,
        'The example(s) below are real messages this specific person sent. Do not write your own version of the message and sprinkle in some similar words — copy the actual structure: the same opening line pattern, the same sentence length and rhythm, the same order of ideas, the same level of directness, the same sign-off style. Only the specific facts should change (company name, contact name, the products/proof points, dates/times) to fit this new message. If you are unsure how casual or short to be, look at the example again rather than guessing generically.',
        samples
          .slice(0, 3)
          .map((s, i) => `Example ${i + 1}:\n${s}`)
          .join('\n\n'),
      ].join('\n\n')
    );
  }

  if (input.explicitInstruction) {
    sections.push(
      `--- INSTRUCTION FOR THIS MESSAGE ONLY (highest priority — follow this even if it conflicts with anything above) ---\n${input.explicitInstruction}`
    );
  }

  return sections.join('\n\n');
}

function buildUserPrompt(input: ComposeInput): string {
  const lines: string[] = [];

  lines.push(`Rep: ${input.rep.name}, ${input.rep.company}${input.rep.location ? `, ${input.rep.location}` : ''}`);
  if (input.rep.phone) lines.push(`Rep callback number: ${input.rep.phone}`);

  lines.push(`Company: ${input.account.name}${input.account.domain ? ` (${input.account.domain})` : ''}`);
  if (input.account.industry) lines.push(`Industry: ${input.account.industry}`);
  if (input.contact) {
    lines.push(`Contact: ${input.contact.name}${input.contact.title ? `, ${input.contact.title}` : ''}${input.contact.role ? ` (role: ${input.contact.role})` : ''}`);
  } else {
    lines.push('Contact: not known — write generally, do not invent a name.');
  }

  if (input.account.campaignFocus) lines.push(`Focus for this outreach: ${input.account.campaignFocus}`);

  if (input.account.relevantFacts.length > 0) {
    lines.push(`Known facts about this company (use at most 1-2 of these, only if they fit naturally — do not list them all):\n${input.account.relevantFacts.map((f) => `- ${f}`).join('\n')}`);
  } else {
    lines.push('No specific research on this company yet. Write a normal contextual introduction — do not invent a reason or a problem.');
  }

  if (input.account.customerProofNames.length > 0) {
    lines.push(`Real customers you can reference (only use these, never invent others): ${input.account.customerProofNames.join(', ')}`);
  } else {
    lines.push('No customer names to reference — do not invent any.');
  }

  if (input.meetingTimes && input.meetingTimes.length > 0) {
    lines.push(`Real availability to offer: ${input.meetingTimes.join(' or ')}`);
  } else {
    lines.push('No specific times were provided — ask generally for a meeting, do not invent specific dates/times.');
  }

  if (input.communicationType === 'post_call_followup' && input.callOutcome) {
    lines.push(`What actually happened on the call — outcome: ${input.callOutcome.outcomeType}${input.callOutcome.notes ? `. Notes: ${input.callOutcome.notes}` : ''}`);
    lines.push('Base this follow-up ONLY on what happened on this call. Do not re-pitch the whole company or introduce unrelated products.');
  }

  const { samples } = resolveSamples(input);
  lines.push(
    samples.length > 0
      ? `Write ${TYPE_LABEL[input.communicationType]} now, following the structure and phrasing of the rep's real example as closely as possible.`
      : `Write ${TYPE_LABEL[input.communicationType]} now.`
  );

  return lines.join('\n');
}

export function composePrompt(input: ComposeInput): { systemPrompt: string; userPrompt: string } {
  return { systemPrompt: buildSystemPrompt(input), userPrompt: buildUserPrompt(input) };
}
