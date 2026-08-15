'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  updateToneNotes,
  addStyleRule,
  removeStyleRule,
  addPhraseToAvoid,
  removePhraseToAvoid,
  addStyleExample,
  removeStyleExample,
  type SampleKind,
} from '@/data/seller-style';

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

const PATH = '/app/settings/seller-style';

export async function updateToneNotesAction(formData: FormData): Promise<void> {
  updateToneNotes(str(formData, 'toneNotes'));
  revalidatePath(PATH);
  redirect(PATH);
}

export async function addStyleRuleAction(formData: FormData): Promise<void> {
  const rule = str(formData, 'rule');
  if (rule) addStyleRule(rule);
  revalidatePath(PATH);
  redirect(PATH);
}

export async function removeStyleRuleAction(rule: string): Promise<void> {
  removeStyleRule(rule);
  revalidatePath(PATH);
  redirect(PATH);
}

export async function addPhraseToAvoidAction(formData: FormData): Promise<void> {
  const phrase = str(formData, 'phrase');
  if (phrase) addPhraseToAvoid(phrase);
  revalidatePath(PATH);
  redirect(PATH);
}

export async function removePhraseToAvoidAction(phrase: string): Promise<void> {
  removePhraseToAvoid(phrase);
  revalidatePath(PATH);
  redirect(PATH);
}

export async function addStyleExampleAction(kind: SampleKind, formData: FormData): Promise<void> {
  const example = str(formData, 'example');
  if (example) addStyleExample(kind, example);
  revalidatePath(PATH);
  redirect(PATH);
}

export async function removeStyleExampleAction(kind: SampleKind, example: string): Promise<void> {
  removeStyleExample(kind, example);
  revalidatePath(PATH);
  redirect(PATH);
}
