'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateSettings } from '@/data/settings';
import { deleteAllLocalData } from '@/data/danger';

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  updateSettings({
    workspaceName: str(formData, 'workspaceName') || 'My Workspace',
    ownerName: str(formData, 'ownerName'),
    timezone: str(formData, 'timezone'),
    territory: str(formData, 'territory'),
    whatYouSell: str(formData, 'whatYouSell'),
    idealBuyerRoles: str(formData, 'idealBuyerRoles'),
    callStyle: str(formData, 'callStyle'),
    phoneNumber: str(formData, 'phoneNumber'),
  });
  revalidatePath('/app/settings');
  redirect('/app/settings?saved=1');
}

export async function deleteLocalDataAction(formData: FormData): Promise<void> {
  const confirmation = str(formData, 'confirmation');
  if (confirmation !== 'DELETE') {
    throw new Error('Type DELETE to confirm.');
  }
  deleteAllLocalData();
  revalidatePath('/app', 'layout');
  redirect('/app');
}
