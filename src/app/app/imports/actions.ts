'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createImportFromUpload,
  saveColumnMapping,
  runValidation,
  resolveImportRow,
  commitImport,
  ImportValidationError,
} from '@/data/imports';

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export async function uploadImportAction(formData: FormData): Promise<void> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Choose a CSV or XLSX file to upload.');
  }
  const extension = file.name.toLowerCase().split('.').pop();
  const fileType = extension === 'csv' ? 'csv' : extension === 'xlsx' ? 'xlsx' : null;
  if (!fileType) {
    throw new Error('Only .csv and .xlsx files are supported.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const listName = str(formData, 'listName') ?? null;

  let imported;
  try {
    imported = await createImportFromUpload(file.name, fileType, buffer, listName);
  } catch (err) {
    throw err instanceof ImportValidationError ? err : new Error('Could not read this file.');
  }

  revalidatePath('/app/imports');
  redirect(`/app/imports/${imported.id}/map`);
}

export async function saveMappingAction(importId: string, formData: FormData): Promise<void> {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const header = key.startsWith('field:') ? key.slice('field:'.length) : null;
    if (header && typeof value === 'string' && value && value !== 'ignore') {
      fields[header] = value;
    }
  }
  saveColumnMapping(importId, fields);
  runValidation(importId);
  revalidatePath(`/app/imports/${importId}`);
  redirect(`/app/imports/${importId}/validate`);
}

export async function resolveImportRowAction(importId: string, rowId: string, decision: 'merge' | 'create_new'): Promise<void> {
  resolveImportRow(rowId, decision);
  revalidatePath(`/app/imports/${importId}/resolve`);
}

export async function commitImportAction(importId: string): Promise<void> {
  commitImport(importId);
  revalidatePath('/app');
  revalidatePath('/app/accounts');
  revalidatePath('/app/people');
  revalidatePath('/app/lists', 'layout');
  revalidatePath(`/app/imports/${importId}/summary`);
  redirect(`/app/imports/${importId}/summary`);
}
