import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Pure DB-write/read logic — no AI/network involved. Confirms
// getAccountBrief prefers a current AI synthesis over the industry
// fallback, and that refreshing it supersedes rather than deletes the
// prior version (docs/EVIDENCE_MODEL.md).
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-ai-synthesis-test-'));
process.env.SCOUT_DB_PATH = path.join(tmpDir, 'scout.db');

const data = await import('@/data');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('replaceAiSynthesis + getAccountBrief', () => {
  it('falls back to industry when no AI synthesis exists', () => {
    const account = data.createAccount({ name: 'Acme Corp', industry: 'Manufacturing', employeeCountRange: '50-200' });
    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatTheyDo).toContain('Manufacturing');
  });

  it('prefers a current AI-synthesized summary over the industry fallback, always SUGGESTED certainty', () => {
    const account = data.createAccount({ name: 'Beta LLC', industry: 'Logistics' });
    data.replaceAiSynthesis(account.id, 'Beta LLC provides regional freight logistics.', ['Recently expanded to a second warehouse.']);

    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatTheyDo).toBe('Beta LLC provides regional freight logistics.');
    expect(brief?.whatMatters).toEqual(['Recently expanded to a second warehouse.']);

    const items = data.getKnowledgeItemsForAccount(account.id);
    const synthesisItems = items.filter((k) => (k.structuredValue as { kind?: string } | null)?.kind?.startsWith('ai_'));
    expect(synthesisItems.every((k) => k.certaintyType === 'SUGGESTED')).toBe(true);
  });

  it('supersedes the prior synthesis on refresh rather than deleting it — history stays in the full timeline', () => {
    const account = data.createAccount({ name: 'Gamma Inc' });
    data.replaceAiSynthesis(account.id, 'First summary.', ['First fact.']);
    data.replaceAiSynthesis(account.id, 'Second, refreshed summary.', ['Second fact.']);

    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatTheyDo).toBe('Second, refreshed summary.');

    const allItems = data.getKnowledgeItemsForAccount(account.id);
    const summaryItems = allItems.filter((k) => (k.structuredValue as { kind?: string } | null)?.kind === 'ai_company_summary');
    expect(summaryItems).toHaveLength(2); // both still exist
    expect(summaryItems.find((k) => k.content === 'First summary.')?.verificationStatus).toBe('superseded');
    expect(summaryItems.find((k) => k.content === 'Second, refreshed summary.')?.verificationStatus).toBe('current');
  });

  it('a manually entered note still shows up in What Matters when no AI synthesis exists', () => {
    const account = data.createAccount({ name: 'Delta Co' });
    data.addKnowledgeItem(account.id, 'Talked to their CFO about renewal timing.');
    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatMatters).toEqual(['Talked to their CFO about renewal timing.']);
  });
});
