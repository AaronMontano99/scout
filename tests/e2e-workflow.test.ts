import { afterAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Full clean-install-to-restart walk through the real local pipeline —
// import a CSV, work it from Today/Lists, log a call, check analytics,
// then simulate a process restart (fresh module graph, same on-disk
// SQLite file) and confirm everything is still there. See the master
// integration spec's "PERSISTENCE IS NON-NEGOTIABLE" section.

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-e2e-test-'));
const dbPath = path.join(tmpDir, 'scout.db');
process.env.SCOUT_DB_PATH = dbPath;

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const SAMPLE_CSV = [
  'Company,Website,Contact,Title,Notes',
  'Acme Corp,acme.com,Jane Doe,VP Operations,"Talked at a trade show, interested in Q3"',
  'Beta Industries,beta.io,John Smith,IT Director,Existing customer since 2022',
].join('\n');

describe('manual end-to-end workflow (real SQLite, no mocks)', () => {
  it('walks the full clean-install flow: import -> list -> today -> log call -> analytics', async () => {
    const data = await import('@/data');
    const imports = await import('@/data/imports');
    const calls = await import('@/data/calls');

    // Step 1: clean install — nothing exists yet.
    expect(data.listAccounts()).toEqual([]);
    expect(data.getTargetLists()).toEqual([]);

    // Step 2-5: import a CSV with an account+contact+note per row, map columns, validate, resolve (nothing to resolve — no existing accounts).
    const importRecord = await imports.createImportFromUpload(
      'prospects.csv',
      'csv',
      Buffer.from(SAMPLE_CSV, 'utf-8'),
      'Imported List'
    );
    expect(importRecord.rowCount).toBe(2);

    imports.saveColumnMapping(importRecord.id, {
      Company: 'account_name',
      Website: 'domain',
      Contact: 'contact_name',
      Title: 'contact_title',
      Notes: 'knowledge_note',
    });
    const validation = imports.runValidation(importRecord.id);
    expect(validation.needsReview).toBe(0); // no pre-existing accounts to collide with
    expect(validation.ready).toBe(2);

    // Step 6: commit the import.
    const summary = imports.commitImport(importRecord.id);
    expect(summary.accountsCreated).toBe(2);
    expect(summary.contactsCreated).toBe(2);
    expect(summary.knowledgeItemsCreated).toBe(2);
    expect(summary.listName).toBe('Imported List');

    // Step 6-7: accounts and people exist and persist.
    const accounts = data.listAccounts();
    expect(accounts.map((a) => a.name).sort()).toEqual(['Acme Corp', 'Beta Industries']);
    const acme = accounts.find((a) => a.name === 'Acme Corp')!;
    expect(acme.primaryDomain).toBe('acme.com');

    const people = data.getPeopleOverview();
    expect(people.map((p) => `${p.contact.firstName} ${p.contact.lastName}`).sort()).toEqual(['Jane Doe', 'John Smith']);

    // Step 8: historical note landed in Account Brain, tagged as imported.
    const acmeNotes = data.getKnowledgeItemsForAccount(acme.id);
    expect(acmeNotes).toHaveLength(1);
    expect(acmeNotes[0]!.origin).toBe('imported');
    expect(acmeNotes[0]!.content).toContain('trade show');

    // Step 9-10: the import created a Target List and added both accounts.
    const lists = data.getTargetLists();
    expect(lists).toHaveLength(1);
    const overview = data.getTargetListOverview(lists[0]!.id)!;
    expect(overview.progress.total).toBe(2);
    expect(overview.progress.worked).toBe(0);

    // Step 11: Today aggregates across active lists, pins outrank ordering.
    const todayBefore = data.getTodayEntries(50);
    expect(todayBefore).toHaveLength(2);
    const acmeItem = todayBefore.find((e) => e.account.id === acme.id)!;
    data.setTargetListItemPinned(acmeItem.item.id, true);
    const todayAfterPin = data.getTodayEntries(50);
    expect(todayAfterPin[0]!.account.id).toBe(acme.id); // pinned account sorts first regardless of priority label

    // Step 12-14: open a brief, add a note, log a call — real memory writes.
    data.addKnowledgeItem(acme.id, 'Manually verified budget owner is finance, not IT.');
    expect(data.getKnowledgeItemsForAccount(acme.id)).toHaveLength(2);

    const openItemId = calls.getPrimaryOpenListItemId(acme.id);
    expect(openItemId).toBe(acmeItem.item.id);
    calls.logCall(acme.id, {
      outcomeType: 'meeting_booked',
      contactRoleObserved: 'Economic buyer',
      notes: 'Great call, booked a demo for next week.',
      targetListItemId: openItemId ?? undefined,
    });

    // Step 15: logging a call marks the list item worked (closes the loop with Lists/Today).
    const itemAfterCall = data.getListRows(lists[0]!.id).find((r) => r.account.id === acme.id)!;
    expect(itemAfterCall.status).toBe('worked');

    // Step 16: analytics reflect the logged call honestly, with real denominators.
    const funnelBeforeRestart = data.getFunnel();
    expect(funnelBeforeRestart.callsAttempted).toBe(1);
    expect(funnelBeforeRestart.meetingsBooked).toBe(1);
    expect(funnelBeforeRestart.callToMeetingRate.rate).toBe(1);
    const emptyRate = data.getFunnel().sellingSituationToOpportunityRate;
    expect(emptyRate.rate).toBeNull(); // zero denominator renders as null, never 0 — see src/domain/analytics.ts

    // Steps 17-18: refresh the browser (no-op for the DB) and restart the
    // dev server — force a completely fresh module graph reading the same
    // on-disk file, exactly like a real process restart would.
    vi.resetModules();
    const dataAfterRestart = await import('@/data');

    const accountsAfterRestart = dataAfterRestart.listAccounts();
    expect(accountsAfterRestart.map((a) => a.name).sort()).toEqual(['Acme Corp', 'Beta Industries']);

    const acmeAfterRestart = accountsAfterRestart.find((a) => a.name === 'Acme Corp')!;
    // 2 manual notes (imported row + manually added) + 2 written by logCall
    // (contact-role-observed + call note), all still present after restart.
    expect(dataAfterRestart.getKnowledgeItemsForAccount(acmeAfterRestart.id)).toHaveLength(4);

    const listsAfterRestart = dataAfterRestart.getTargetLists();
    expect(listsAfterRestart).toHaveLength(1);
    const rowsAfterRestart = dataAfterRestart.getListRows(listsAfterRestart[0]!.id);
    const acmeRowAfterRestart = rowsAfterRestart.find((r) => r.account.id === acmeAfterRestart.id)!;
    expect(acmeRowAfterRestart.status).toBe('worked'); // worked state survived the restart
    expect(acmeRowAfterRestart.pinned).toBe(true); // pin survived the restart

    const funnelAfterRestart = dataAfterRestart.getFunnel();
    expect(funnelAfterRestart.callsAttempted).toBe(1);
    expect(funnelAfterRestart.meetingsBooked).toBe(1);
  });
});
