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
  text: string;
  modelUsed: string;
  lintIssues: { rule: string; detail: string }[];
}

/** Not a form action — called directly from a client component (generation takes 10-30+ seconds; the caller shows its own loading state, matching RefreshResearchButton's pattern). */
export async function generateAndSaveCommunication(input: GenerateAndSaveInput): Promise<GenerateAndSaveResult> {
  const result = await generateCommunication({
    accountId: input.accountId,
    communicationType: input.communicationType,
    meetingTimes: input.meetingTimes?.filter(Boolean),
    explicitInstruction: input.explicitInstruction,
  });

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
  return { text: result.text, modelUsed: result.modelUsed, lintIssues: result.lintIssues };
}

export async function getSavedCommunication(accountId: string, kind: GeneratedCommunicationKind): Promise<string | null> {
  return getGeneratedCommunication(accountId, kind)?.content ?? null;
}
