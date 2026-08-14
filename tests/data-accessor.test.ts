import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// SCOUT_DB_PATH must be set before src/db/client.ts's module-level DB_PATH
// is evaluated, so this uses a dynamic import — a real per-test SQLite
// file, isolated from the actual dev database. See src/db/client.ts,
// docs/LOCAL_MODE.md.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-data-test-'));
process.env.SCOUT_DB_PATH = path.join(tmpDir, 'scout.db');

const data = await import('@/data');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('src/data (real accessor layer)', () => {
  it('mirrors src/demo/index.ts shapes for a manually-entered account end to end', () => {
    const account = data.createAccount({ name: 'Acme Corp', industry: 'Manufacturing', employeeCountRange: '50-200' });
    expect(account.name).toBe('Acme Corp');
    expect(account.normalizedName).toBe('acme');
    expect(account.researchStatus).toBe('limited_data'); // honest — no research pipeline exists
    expect(account.identityStatus).toBe('confirmed'); // no ambiguity for a manually-entered account

    const contact = data.createContact(account.id, { firstName: 'Jane', lastName: 'Doe', title: 'VP Ops' });
    expect(contact.accountId).toBe(account.id);

    const note = data.addKnowledgeItem(account.id, 'Talked to Jane about their Q3 expansion.');
    expect(note.origin).toBe('user_entered');
    expect(note.certaintyType).toBe('KNOWN');

    const list = data.createTargetList({ name: 'My List' });
    const item = data.addAccountToList(list.id, account.id);
    expect(item.status).toBe('not_started');

    const overview = data.getTargetListOverview(list.id);
    expect(overview?.progress.total).toBe(1);
    expect(overview?.progress.worked).toBe(0);

    const rows = data.getListRows(list.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.account.id).toBe(account.id);
    expect(rows[0]!.priorityLabel).toBe('limited_data'); // no fake score — see docs/TARGET_LISTS.md

    const contacts = data.getContactsForAccount(account.id);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]!.contact.firstName).toBe('Jane');
    expect(contacts[0]!.relationship.certaintyType).toBe('KNOWN');

    const knowledgeItems = data.getKnowledgeItemsForAccount(account.id);
    expect(knowledgeItems).toHaveLength(1);
    expect(knowledgeItems[0]!.content).toBe('Talked to Jane about their Q3 expansion.');

    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatTheyDo).toContain('Manufacturing');
    expect(brief?.whatMatters).toEqual(['Talked to Jane about their Q3 expansion.']);
  });

  it('returns null/empty, never throws, for an account with no data entered yet', () => {
    const account = data.createAccount({ name: 'Bare Account' });
    expect(data.getKnowledgeItemsForAccount(account.id)).toEqual([]);
    expect(data.getContactsForAccount(account.id)).toEqual([]);
    expect(data.getCallOutcomesForAccount(account.id)).toEqual([]);

    const brief = data.getAccountBrief(account.id);
    expect(brief?.whatTheyDo).toContain('No description added yet');
    expect(brief?.whatMatters[0]).toContain('No notes yet');
  });

  it('getAccount/getTargetList return null for unknown ids instead of throwing', () => {
    expect(data.getAccount('nonexistent')).toBeNull();
    expect(data.getTargetList('nonexistent')).toBeNull();
    expect(data.getTargetListOverview('nonexistent')).toBeNull();
  });

  it('analytics accessors return well-shaped zeroed-out results against an empty events table', () => {
    const funnel = data.getFunnel();
    expect(funnel.callsAttempted).toBe(0);
    expect(funnel.pickupRate.rate).toBeNull(); // 0-denominator rate is null, not 0 — see src/domain/analytics.ts

    const activity = data.getActivityCounts();
    expect(activity.call_attempted).toBe(0);
  });
});
