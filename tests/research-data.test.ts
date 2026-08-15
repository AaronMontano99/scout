import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated per-test SQLite file, same pattern as tests/data-accessor.test.ts.
// Pure DB-write logic only — the fetch side (free-web-research-provider.ts)
// is tested separately without touching the network.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-research-test-'));
process.env.SCOUT_DB_PATH = path.join(tmpDir, 'scout.db');

const data = await import('@/data');
const research = await import('@/data/research');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('saveResearchFindings', () => {
  it('writes a Source + ResearchFinding per evidence item, always SUGGESTED certainty', () => {
    const account = data.createAccount({ name: 'Acme Corp', primaryDomain: 'acme.com' });

    const result = research.saveResearchFindings(account.id, [
      { sourceName: 'Acme Corp — Home', sourceUrl: 'https://acme.com', content: 'Acme makes widgets.', retrievedAt: new Date().toISOString(), confidence: 0.5 },
      {
        sourceName: 'Acme raises Series B',
        sourceUrl: 'https://news.example.com/acme-series-b',
        content: 'Acme announced funding.',
        retrievedAt: new Date().toISOString(),
        relevantDate: new Date().toISOString(),
        confidence: 0.4,
      },
    ]);

    expect(result.findingsSaved).toBe(2);
    expect(result.findingsSkipped).toBe(0);

    const findings = data.getResearchFindingsForAccount(account.id);
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.certaintyType === 'SUGGESTED')).toBe(true); // automated pull, never auto-promoted
  });

  it('skips evidence whose URL already has a stored finding for this account, so repeated refreshes do not duplicate', () => {
    const account = data.createAccount({ name: 'Beta LLC' });
    research.saveResearchFindings(account.id, [
      { sourceName: 'Beta — Home', sourceUrl: 'https://beta.com', content: 'Beta does things.', retrievedAt: new Date().toISOString() },
    ]);

    const second = research.saveResearchFindings(account.id, [
      { sourceName: 'Beta — Home', sourceUrl: 'https://beta.com', content: 'Beta does things (refetched).', retrievedAt: new Date().toISOString() },
    ]);

    expect(second.findingsSaved).toBe(0);
    expect(second.findingsSkipped).toBe(1);
    expect(data.getResearchFindingsForAccount(account.id)).toHaveLength(1); // no duplicate created
  });

  it('always records a ResearchRun for the attempt, even when zero evidence came back', () => {
    const account = data.createAccount({ name: 'Gamma Inc' });
    const result = research.saveResearchFindings(account.id, []);

    expect(result.findingsSaved).toBe(0);
    const runs = research.getResearchRunsForAccount(account.id) as { status: string }[];
    expect(runs).toHaveLength(1);
    expect(runs[0]!.status).toBe('completed');
  });
});
