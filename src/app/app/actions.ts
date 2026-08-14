'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAccount, createContact, addKnowledgeItem, createTargetList, addAccountToList } from '@/data';
import type { AccountRelationshipStatus, BuyingRole } from '@/types/product';

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export async function createAccountAction(formData: FormData): Promise<void> {
  const name = str(formData, 'name');
  if (!name) throw new Error('Account name is required');

  const account = createAccount({
    name,
    primaryDomain: str(formData, 'primaryDomain'),
    industry: str(formData, 'industry'),
    employeeCountRange: str(formData, 'employeeCountRange'),
    relationshipStatus: str(formData, 'relationshipStatus') as AccountRelationshipStatus | undefined,
  });

  revalidatePath('/app');
  redirect(`/app/accounts/${account.id}`);
}

export async function createContactAction(accountId: string, formData: FormData): Promise<void> {
  createContact(accountId, {
    firstName: str(formData, 'firstName'),
    lastName: str(formData, 'lastName'),
    title: str(formData, 'title'),
    email: str(formData, 'email'),
    phone: str(formData, 'phone'),
    linkedinUrl: str(formData, 'linkedinUrl'),
    roleHypothesis: str(formData, 'roleHypothesis') as BuyingRole | undefined,
  });

  revalidatePath(`/app/accounts/${accountId}`);
  redirect(`/app/accounts/${accountId}`);
}

export async function addNoteAction(accountId: string, formData: FormData): Promise<void> {
  const content = str(formData, 'content');
  if (!content) throw new Error('Note content is required');

  addKnowledgeItem(accountId, content);

  revalidatePath(`/app/accounts/${accountId}`);
  redirect(`/app/accounts/${accountId}`);
}

export async function createTargetListAction(formData: FormData): Promise<void> {
  const name = str(formData, 'name');
  if (!name) throw new Error('List name is required');

  const list = createTargetList({ name, description: str(formData, 'description') });

  revalidatePath('/app/lists');
  redirect(`/app/lists/${list.id}`);
}

export async function addAccountToListAction(listId: string, formData: FormData): Promise<void> {
  const accountId = str(formData, 'accountId');
  if (!accountId) throw new Error('Choose an account to add');

  addAccountToList(listId, accountId);

  revalidatePath(`/app/lists/${listId}`);
  redirect(`/app/lists/${listId}`);
}
