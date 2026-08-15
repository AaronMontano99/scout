/**
 * Seller-voice generation — gathers real context, composes the prompt
 * (compose-prompt.ts), calls the AI provider, and runs the hard-rule
 * lint (src/domain/seller-voice-quality.ts) with one bounded retry if
 * it fails. Never a revision loop — one retry, then return whatever
 * came back either way (master prompt Phase 52-54's quality checks are
 * enforced here, not left to a second, slower, unbounded LLM pass).
 */
import { getAIProvider } from '@/ai/config';
import { getAccount } from '@/data';
import { getSettings } from '@/data/settings';
import { getOrCreateSellerStyleProfile } from '@/data/seller-style';
import { lintSellerVoiceOutput, type SellerVoiceLintIssue } from '@/domain/seller-voice-quality';
import { composePrompt, type CommunicationType, type ComposeInput } from './compose-prompt';
import { getAccountAngle, getPrimaryContact, getRepInfo } from './context';

export interface GenerateCommunicationInput {
  accountId: string;
  communicationType: CommunicationType;
  meetingTimes?: string[];
  callOutcome?: { outcomeType: string; notes: string | null };
  /** One-time-only instruction for this request — never persisted (see seller-style.ts's addStyleRule for the "remember this" path). */
  explicitInstruction?: string;
}

export interface GenerateCommunicationResult {
  text: string;
  modelUsed: string;
  lintIssues: SellerVoiceLintIssue[]; // non-empty means the retry still didn't fully clear the hard rules — surfaced, never hidden
}

export async function generateCommunication(input: GenerateCommunicationInput): Promise<GenerateCommunicationResult> {
  const account = getAccount(input.accountId);
  if (!account) throw new Error('Account not found');

  const angle = getAccountAngle(input.accountId);
  const contact = getPrimaryContact(input.accountId);
  const rep = getRepInfo();
  const sellerStyle = getOrCreateSellerStyleProfile();
  const orgSettings = getSettings();

  const composeInput: ComposeInput = {
    communicationType: input.communicationType,
    account: { name: account.name, domain: account.primaryDomain, industry: account.industry, ...angle },
    contact,
    rep,
    meetingTimes: input.meetingTimes,
    callOutcome: input.callOutcome,
    explicitInstruction: input.explicitInstruction,
    sellerStyle,
    orgSettings,
  };

  const { systemPrompt, userPrompt } = composePrompt(composeInput);
  const provider = getAIProvider('reasoning');

  const first = await provider.generate({ systemPrompt, userPrompt });
  let text = stripMetaPreamble(first.text);
  let issues = lintSellerVoiceOutput(text, sellerStyle.styleRules.phrasesToAvoid);

  if (issues.length > 0) {
    // One bounded retry, telling the model exactly what it got wrong — never an open-ended revision loop.
    const retryPrompt = `${userPrompt}\n\nYour previous attempt violated these rules, fix them: ${issues.map((i) => i.detail).join('; ')}. Rewrite the whole message clean.`;
    const retry = await provider.generate({ systemPrompt, userPrompt: retryPrompt });
    const retryText = stripMetaPreamble(retry.text);
    const retryIssues = lintSellerVoiceOutput(retryText, sellerStyle.styleRules.phrasesToAvoid);
    // Keep the retry only if it's actually better — never worse than the first attempt.
    if (retryIssues.length < issues.length) {
      text = retryText;
      issues = retryIssues;
    }
  }

  return { text, modelUsed: first.modelUsed, lintIssues: issues };
}

const PREAMBLE_PATTERN = /^(here('s| is)( the)?[^:\n]*:|sure[,!]?\s|of course[,!]?\s)/i;
function stripMetaPreamble(text: string): string {
  return text.replace(PREAMBLE_PATTERN, '').trim();
}
