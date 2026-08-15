'use server';

import { revalidatePath } from 'next/cache';
import { generateCommunication } from '@/ai/seller-voice/generate';
import { saveGeneratedCommunication, getGeneratedCommunication, recordAnalyticsEvent, type GeneratedCommunicationKind } from '@/data';
import { addStyleRule } from '@/data/seller-style';
import type { CommunicationType } from '@/ai/seller-voice/compose-prompt';

const KIND_FOR_TYPE: Partial<Record<CommunicationType, GeneratedCommunicationKind>> = {
  call_script: 'call_script',
  voicemail: 'voicemail_script',
  email: 'email_draft',
};

export interface GenerateAndSaveInput {
  accountId: string;
  communicationType: CommunicationType;
  meetingTimes?: string[];
  explicitInstruction?: string;
  /** Phase 49 — "from now on" — persists the instruction as a durable rule instead of a one-time override. */
  rememberInstruction?: boolean;
}

export interface GenerateAndSaveResult {
  text: string | null;
  modelUsed: string | null;
  lintIssues: { rule: string; detail: string }[];
  /** Set when generation failed — the caller shows this instead of throwing, since a slow/unavailable local model is a normal, expected outcome, not a bug. */
  error: string | null;
}

/**
 * Not a form action — called directly from a client component
 * (generation can take up to a few minutes on local hardware; the
 * caller shows its own loading state, matching RefreshResearchButton's
 * pattern). Never throws: a local Ollama call can time out or the
 * server can be down/restarting, and that's an expected, user-facing
 * outcome here, not an unhandled crash — see docs/SELLER_STYLE.md.
 */
export async function generateAndSaveCommunication(input: GenerateAndSaveInput): Promise<GenerateAndSaveResult> {
  let result;
  try {
    result = await generateCommunication({
      accountId: input.accountId,
      communicationType: input.communicationType,
      meetingTimes: input.meetingTimes?.filter(Boolean),
      explicitInstruction: input.explicitInstruction,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? "Ollama didn't respond in time — it may be under heavy load. Try again in a moment."
        : "Couldn't reach Ollama. Make sure it's running (ollama serve) and try again.";
    return { text: null, modelUsed: null, lintIssues: [], error: message };
  }

  const kind = KIND_FOR_TYPE[input.communicationType];
  if (kind) {
    saveGeneratedCommunication(input.accountId, kind, result.text);
  }
  if (input.communicationType === 'email') {
    recordAnalyticsEvent({ eventType: 'email_drafted', accountId: input.accountId });
  }
  if (input.rememberInstruction && input.explicitInstruction) {
    addStyleRule(input.explicitInstruction);
  }

  revalidatePath(`/app/accounts/${input.accountId}`);
  return { text: result.text, modelUsed: result.modelUsed, lintIssues: result.lintIssues, error: null };
}

export async function getSavedCommunication(accountId: string, kind: GeneratedCommunicationKind): Promise<string | null> {
  return getGeneratedCommunication(accountId, kind)?.content ?? null;
}
