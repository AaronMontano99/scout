'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logCall, getPrimaryOpenListItemId } from '@/data/calls';
import type { CallOutcomeType } from '@/types/product';

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export async function logCallAction(accountId: string, formData: FormData): Promise<void> {
  const outcomeType = str(formData, 'outcomeType') as CallOutcomeType | undefined;
  if (!outcomeType) throw new Error('Choose a call outcome.');

  logCall(accountId, {
    outcomeType,
    contactId: str(formData, 'contactId'),
    contactRoleObserved: str(formData, 'contactRoleObserved'),
    currentVendor: str(formData, 'currentVendor'),
    timingMentioned: str(formData, 'timingMentioned'),
    notes: str(formData, 'notes'),
    targetListItemId: getPrimaryOpenListItemId(accountId) ?? undefined,
  });

  revalidatePath(`/app/accounts/${accountId}`);
  revalidatePath('/app');
  revalidatePath('/app/lists', 'layout');
  revalidatePath('/app/analytics');
  redirect(`/app/accounts/${accountId}`);
}
