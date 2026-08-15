/**
 * Gathers real, curated structured context for a communication —
 * never a raw research dump (master prompt Phase 19/51: "use only
 * approximately 1-2 highly relevant facts"). This is the ONLY place
 * that decides which stored facts are worth including; generate.ts
 * just writes from whatever this returns.
 */
import {
  getAccount,
  getContactsForAccount,
  getKnowledgeItemsForAccount,
  getResearchFindingsForAccount,
  getListsForAccount,
  listAccounts,
} from '@/data';
import { getSettings } from '@/data/settings';
import type { Account } from '@/types/product';

export interface AccountAngle {
  /** 1-3 short, concrete facts worth mentioning — already the curated subset, not the full timeline. */
  relevantFacts: string[];
  /** Names of real current-customer accounts in the same industry — the only legitimate source of "customer proof" (never invented). */
  customerProofNames: string[];
  /** A Target List's research focus, if the account is on one — the closest real equivalent to "campaign focus." */
  campaignFocus: string | null;
}

const MAX_RELEVANT_FACTS = 3;

/** Picks the most useful, most recent, real facts about an account — capped, per Phase 19's "don't dump research into the message." */
export function getAccountAngle(accountId: string): AccountAngle {
  const account = getAccount(accountId);
  if (!account) return { relevantFacts: [], customerProofNames: [], campaignFocus: null };

  // Every past generated call script/voicemail/email is also a
  // knowledge_items row (type 'generated_communication') — it must
  // never be treated as a "fact about the company," or a single bad
  // generation permanently poisons every generation after it by
  // feeding its own output back in as if it were real research.
  const knowledgeItems = getKnowledgeItemsForAccount(accountId).filter(
    (k) => k.verificationStatus === 'current' && k.type !== 'generated_communication'
  );
  const findings = getResearchFindingsForAccount(accountId);

  // Prefer real recorded knowledge (something a person or a fetched
  // source actually said) over generic account fields. Most-recent
  // first, deduplicated, capped. Only news-type findings qualify as a
  // "fact" here — a raw company-website scrape is the prospect's own
  // marketing copy (often 1000+ characters of nav/tagline text), not a
  // fact about them, and feeding it in whole caused the model to quote
  // the prospect's own website tagline back as if it were the rep's —
  // see docs/SELLER_STYLE.md. A short AI-synthesized company summary
  // exists for that (ai_company_summary, deliberately excluded here to
  // avoid feeding AI output back into another AI generation).
  const MAX_FACT_LENGTH = 220;
  const factCandidates = [
    ...knowledgeItems
      .filter((k) => !(k.structuredValue as { kind?: string } | null)?.kind?.startsWith('ai_'))
      .map((k) => k.content),
    ...findings.filter((f) => f.findingType === 'news').map((f) => f.content),
  ].map((f) => (f.length > MAX_FACT_LENGTH ? `${f.slice(0, MAX_FACT_LENGTH).trim()}…` : f));
  const relevantFacts = [...new Set(factCandidates)].slice(0, MAX_RELEVANT_FACTS);

  const lists = getListsForAccount(accountId);
  const campaignFocus = lists.find((l) => l.researchFocus)?.researchFocus ?? null;

  const customerProofNames = findRealCustomerProof(account);

  return { relevantFacts, customerProofNames, campaignFocus };
}

/** Real accounts you already work with in the same industry — the only source of "customer proof" this ever uses. Never invents a client name. See master prompt Phase 21. */
function findRealCustomerProof(account: Account, limit = 3): string[] {
  if (!account.industry) return [];
  return listAccounts()
    .filter((a) => a.id !== account.id && a.relationshipStatus === 'current_customer' && a.industry === account.industry)
    .slice(0, limit)
    .map((a) => a.name);
}

export interface ContactInfo {
  name: string;
  title: string | null;
  role: string | null;
}

export function getPrimaryContact(accountId: string): ContactInfo | null {
  const contacts = getContactsForAccount(accountId);
  const top = contacts[0];
  if (!top) return null;
  const name = `${top.contact.firstName ?? ''} ${top.contact.lastName ?? ''}`.trim();
  if (!name) return null;
  return { name, title: top.contact.title, role: top.relationship.roleHypothesis };
}

export interface RepInfo {
  name: string;
  company: string;
  location: string;
  phone: string;
}

export function getRepInfo(): RepInfo {
  const settings = getSettings();
  return {
    name: settings.ownerName || 'the rep',
    company: settings.workspaceName || 'our company',
    location: settings.territory,
    phone: settings.phoneNumber,
  };
}
