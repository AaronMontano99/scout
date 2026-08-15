'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logCall, getPrimaryOpenListItemId, updateCleanNote } from '@/data/calls';
import { getAIProvider } from '@/ai/config';
import type { CallOutcomeType } from '@/types/product';

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// Small local models often prepend a lead-in sentence despite being
// told not to ("Here is the rewritten note:") — stripped as a second
// line of defense on top of the prompt instruction.
const PREAMBLE_PATTERN = /^(here('s| is)( the)?[^:]*:|rewritten (crm )?note:|clean(ed)? note:)\s*/i;

/** Best-effort — rewrites the rep's raw dictated note into a clean CRM-style note. Never adds facts that weren't in the raw note; if Ollama isn't running this silently does nothing and the raw note (already saved) stands on its own. */
async function generateCleanNote(callOutcomeId: string, rawNote: string): Promise<void> {
  try {
    const result = await getAIProvider('summarization').summarize({
      content:
        `Rewrite this rep's rough call note into a clean, professional CRM note. Keep every fact — do not add ` +
        `anything that isn't in the original. Fix grammar/structure only. Respond with ONLY the rewritten note ` +
        `itself — no lead-in phrase, no "Here is...", no commentary before or after it.\n\nRaw note: ${rawNote}`,
      maxLength: 600,
    });
    const cleaned = result.summary.replace(PREAMBLE_PATTERN, '').trim();
    updateCleanNote(callOutcomeId, cleaned);
  } catch {
    // Ollama not running or errored — the raw note is already saved either way.
  }
}

export async function logCallAction(accountId: string, formData: FormData): Promise<void> {
  const outcomeType = str(formData, 'outcomeType') as CallOutcomeType | undefined;
  if (!outcomeType) throw new Error('Choose a call outcome.');
  const notes = str(formData, 'notes');

  const { callOutcomeId } = logCall(accountId, {
    outcomeType,
    contactId: str(formData, 'contactId'),
    contactRoleObserved: str(formData, 'contactRoleObserved'),
    currentVendor: str(formData, 'currentVendor'),
    timingMentioned: str(formData, 'timingMentioned'),
    notes,
    targetListItemId: getPrimaryOpenListItemId(accountId) ?? undefined,
  });

  if (notes) {
    // Not awaited — local LLM inference can take 10-20+ seconds, far
    // too slow to hold up "Approve and save." The raw note is already
    // saved; the clean note fills in on its own once it's ready (the
    // rep can refresh the account page to see it).
    generateCleanNote(callOutcomeId, notes).catch(() => undefined);
  }

  revalidatePath(`/app/accounts/${accountId}`);
  revalidatePath('/app');
  revalidatePath('/app/lists', 'layout');
  revalidatePath('/app/analytics');
  redirect(`/app/accounts/${accountId}`);
}
