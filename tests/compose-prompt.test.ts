import { describe, expect, it } from 'vitest';
import { composePrompt, type ComposeInput } from '@/ai/seller-voice/compose-prompt';

// Pure function — no network. Confirms the master prompt's no-
// hallucination rules (Phases 20/40/50/51) and style hierarchy
// (Phase 26) are actually present in what gets sent to the model,
// not just described in a doc.

const baseInput: ComposeInput = {
  communicationType: 'email',
  account: { name: 'Acme Corp', domain: 'acme.com', industry: 'Construction', relevantFacts: [], customerProofNames: [], campaignFocus: null },
  contact: null,
  rep: { name: 'Aaron', company: 'Pacific Office Automation', location: 'San Jose', phone: '555-1234' },
  sellerStyle: {
    id: 'x',
    organizationId: 'local',
    membershipId: 'local-membership',
    sampleScripts: [],
    sampleEmails: [],
    sampleVoicemails: [],
    toneNotes: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    styleRules: { rules: [], phrasesToAvoid: [] },
  },
  orgSettings: { whatYouSell: '', idealBuyerRoles: '', callStyle: '' },
};

describe('composePrompt — no-hallucination guarantees', () => {
  it('instructs the model not to invent facts when no research exists (Phase 50)', () => {
    const { userPrompt } = composePrompt(baseInput);
    expect(userPrompt).toMatch(/no specific research.*write a normal contextual introduction/i);
    expect(userPrompt).not.toMatch(/acme corp is struggling/i);
  });

  it('instructs the model not to invent meeting times when none are supplied (Phase 40)', () => {
    const { userPrompt } = composePrompt(baseInput);
    expect(userPrompt).toMatch(/no specific times were provided.*do not invent/i);
  });

  it('offers only the real supplied meeting times when present, never inventing extras', () => {
    const { userPrompt } = composePrompt({ ...baseInput, meetingTimes: ['Tuesday 2pm', 'Wednesday 10am'] });
    expect(userPrompt).toContain('Tuesday 2pm or Wednesday 10am');
  });

  it('instructs the model not to invent customer names when none are supplied (Phase 21)', () => {
    const { userPrompt } = composePrompt(baseInput);
    expect(userPrompt).toMatch(/no customer names to reference.*do not invent/i);
  });

  it('passes through only real, curated facts, capped, when they exist', () => {
    const { userPrompt } = composePrompt({
      ...baseInput,
      account: { ...baseInput.account, relevantFacts: ['Recently opened a second office'], customerProofNames: ['Ferrari Ottoboni', 'Lathrop GPM'] },
    });
    expect(userPrompt).toContain('Recently opened a second office');
    expect(userPrompt).toContain('Ferrari Ottoboni, Lathrop GPM');
  });
});

describe('composePrompt — style hierarchy (Phase 26)', () => {
  it('includes the default seller voice when no saved style exists', () => {
    const { systemPrompt } = composePrompt(baseInput);
    expect(systemPrompt).toContain("SCOUT'S DEFAULT SELLER VOICE");
    expect(systemPrompt).not.toContain("THIS REP'S SAVED STYLE");
  });

  it('includes the saved style section, explicit rules, and phrases to avoid when set', () => {
    const input: ComposeInput = {
      ...baseInput,
      sellerStyle: {
        ...baseInput.sellerStyle,
        toneNotes: 'Very direct, short sentences.',
        styleRules: { rules: ['Never use dashes'], phrasesToAvoid: ['circle back'] },
      },
    };
    const { systemPrompt } = composePrompt(input);
    expect(systemPrompt).toContain("THIS REP'S SAVED STYLE");
    expect(systemPrompt).toContain('Very direct, short sentences.');
    expect(systemPrompt).toContain('Never use dashes');
    expect(systemPrompt).toContain('circle back');
  });

  it('places a one-time explicit instruction last, marked highest priority, without saving it anywhere (Phase 48)', () => {
    const { systemPrompt } = composePrompt({ ...baseInput, explicitInstruction: 'Make this one more formal, it is going to the CEO.' });
    expect(systemPrompt).toContain('INSTRUCTION FOR THIS MESSAGE ONLY');
    expect(systemPrompt).toContain('highest priority');
    expect(systemPrompt.indexOf('INSTRUCTION FOR THIS MESSAGE ONLY')).toBeGreaterThan(systemPrompt.indexOf("DEFAULT SELLER VOICE"));
  });

  it('omits the one-time instruction section entirely when none is given', () => {
    const { systemPrompt } = composePrompt(baseInput);
    expect(systemPrompt).not.toContain('INSTRUCTION FOR THIS MESSAGE ONLY');
  });

  it('includes the rep\'s real callback number for call-script/voicemail types', () => {
    const { userPrompt } = composePrompt({ ...baseInput, communicationType: 'call_script' });
    expect(userPrompt).toContain('555-1234');
  });

  it('includes real sample examples matching the communication type only', () => {
    const input: ComposeInput = {
      ...baseInput,
      communicationType: 'email',
      sellerStyle: { ...baseInput.sellerStyle, sampleEmails: ['Hi Ryan, happy Friday!...'], sampleScripts: ['This should not appear'] },
    };
    const { systemPrompt } = composePrompt(input);
    expect(systemPrompt).toContain('Hi Ryan, happy Friday!...');
    expect(systemPrompt).not.toContain('This should not appear');
  });
});

describe('composePrompt — post-call follow-up grounding (Phase 22)', () => {
  it('bases the follow-up only on the actual call outcome and instructs against re-pitching', () => {
    const { userPrompt } = composePrompt({
      ...baseInput,
      communicationType: 'post_call_followup',
      callOutcome: { outcomeType: 'meeting_booked', notes: 'Discussed pricing, wants a demo next week.' },
    });
    expect(userPrompt).toContain('meeting_booked');
    expect(userPrompt).toContain('Discussed pricing, wants a demo next week.');
    expect(userPrompt).toMatch(/do not re-pitch the whole company/i);
  });
});
