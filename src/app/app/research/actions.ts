'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccount } from '@/data';
import { saveResearchFindings } from '@/data/research';
import { freeWebResearchProvider } from '@/services/free-web-research-provider';

/** Real research: fetches the account's public website + public news search, saves whatever comes back. Best-effort — network failures never throw, they just mean zero new findings. */
export async function runResearchForAccount(accountId: string): Promise<{ saved: number; skipped: number }> {
  const account = getAccount(accountId);
  if (!account) return { saved: 0, skipped: 0 };

  const evidence = await freeWebResearchProvider.searchCompany({
    name: account.name,
    domain: account.primaryDomain ?? undefined,
    organizationId: 'local',
  });

  const result = saveResearchFindings(accountId, evidence, 'user_request');
  return { saved: result.findingsSaved, skipped: result.findingsSkipped };
}

export async function refreshResearchAction(accountId: string, redirectTo: string): Promise<void> {
  await runResearchForAccount(accountId);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
