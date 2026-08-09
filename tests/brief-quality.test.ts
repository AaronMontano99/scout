import { describe, expect, it } from 'vitest';
import { lintHypeLanguage, lintUnsupportedCausality, lintVerbosity, lintWhatTheyDo } from '@/domain/brief-quality';
import { DEMO_ACCOUNT_BRIEFS } from '@/demo/fixtures';

describe('lintHypeLanguage', () => {
  it('flags product spec §100\'s own bad example', () => {
    const issues = lintHypeLanguage(
      'Acme is an innovative, rapidly evolving market leader poised for digital transformation.'
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it('does not flag the good example from the same spec section', () => {
    expect(lintHypeLanguage('Acme operates three Bay Area locations and announced a fourth in June.')).toHaveLength(0);
  });
});

describe('lintUnsupportedCausality', () => {
  it('flags product spec §57\'s disallowed inference', () => {
    expect(lintUnsupportedCausality('Acme is struggling with its MSP.').length).toBeGreaterThan(0);
  });

  it('allows the hedged, spec-approved phrasing', () => {
    expect(
      lintUnsupportedCausality('This may indicate investment in internal IT capacity.')
    ).toHaveLength(0);
  });
});

describe('lintVerbosity', () => {
  it('flags a "what they do" field that reads like a biography, not 1-2 sentences', () => {
    const longText = Array(50).fill('word').join(' ');
    expect(lintVerbosity(longText).length).toBeGreaterThan(0);
  });

  it('allows a genuinely concise description', () => {
    expect(
      lintVerbosity(
        'Acme Landscaping is a Northern California commercial landscaping contractor providing maintenance, irrigation and landscape-construction services to commercial properties.'
      )
    ).toHaveLength(0);
  });
});

describe('golden brief regression — demo fixtures should never regress into corporate hype (product spec §116)', () => {
  it('every demo AccountBrief.whatTheyDo passes the full lint', () => {
    for (const [accountId, brief] of Object.entries(DEMO_ACCOUNT_BRIEFS)) {
      const issues = lintWhatTheyDo(brief.whatTheyDo);
      expect(issues, `${accountId}: ${JSON.stringify(issues)}`).toHaveLength(0);
    }
  });
});
