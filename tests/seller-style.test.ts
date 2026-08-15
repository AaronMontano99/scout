import { afterAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated per-test SQLite file. Confirms Seller Style Memory actually
// persists — the whole point of the feature (docs/SELLER_STYLE.md,
// master prompt Phase 45: "no style reminder was supplied").
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-seller-style-test-'));
process.env.SCOUT_DB_PATH = path.join(tmpDir, 'scout.db');

const sellerStyle = await import('@/data/seller-style');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getOrCreateSellerStyleProfile', () => {
  it('creates an empty profile on first access rather than requiring the rep to initialize one', () => {
    const profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.sampleScripts).toEqual([]);
    expect(profile.styleRules).toEqual({ rules: [], phrasesToAvoid: [] });
  });

  it('returns the same profile on repeated calls rather than creating duplicates', () => {
    const first = sellerStyle.getOrCreateSellerStyleProfile();
    const second = sellerStyle.getOrCreateSellerStyleProfile();
    expect(second.id).toBe(first.id);
  });
});

describe('explicit rules and phrases to avoid', () => {
  it('persists an added rule and lets it be removed', () => {
    sellerStyle.addStyleRule('Never use dashes');
    sellerStyle.addStyleRule('Always offer two specific meeting times');
    let profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.styleRules.rules).toEqual(['Never use dashes', 'Always offer two specific meeting times']);

    sellerStyle.removeStyleRule('Never use dashes');
    profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.styleRules.rules).toEqual(['Always offer two specific meeting times']);
  });

  it('persists phrases to avoid independently of rules', () => {
    sellerStyle.addPhraseToAvoid('circle back');
    sellerStyle.addPhraseToAvoid('reach out');
    const profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.styleRules.phrasesToAvoid).toEqual(['circle back', 'reach out']);
  });
});

describe('sample examples (how a rep teaches Scout their voice)', () => {
  it('adds and removes examples per communication type independently', () => {
    sellerStyle.addStyleExample('sampleEmails', 'Hi Ryan, happy Friday!...');
    sellerStyle.addStyleExample('sampleScripts', 'Hi, this is Aaron with...');
    let profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.sampleEmails).toEqual(['Hi Ryan, happy Friday!...']);
    expect(profile.sampleScripts).toEqual(['Hi, this is Aaron with...']);
    expect(profile.sampleVoicemails).toEqual([]);

    sellerStyle.removeStyleExample('sampleEmails', 'Hi Ryan, happy Friday!...');
    profile = sellerStyle.getOrCreateSellerStyleProfile();
    expect(profile.sampleEmails).toEqual([]);
  });
});

describe('cross-restart persistence', () => {
  it('survives a simulated process restart — the master prompt\'s core requirement: "no style reminder was supplied"', async () => {
    sellerStyle.addStyleRule('Keep emails under 100 words');
    sellerStyle.updateToneNotes('Direct, conversational, no corporate buzzwords.');

    // Force a fresh module graph reading the same on-disk file — see
    // tests/e2e-workflow.test.ts for why this is a faithful restart simulation.
    vi.resetModules();
    const freshSellerStyle = await import('@/data/seller-style');
    const profile = freshSellerStyle.getOrCreateSellerStyleProfile();

    expect(profile.styleRules.rules).toContain('Keep emails under 100 words');
    expect(profile.toneNotes).toBe('Direct, conversational, no corporate buzzwords.');
  });
});
