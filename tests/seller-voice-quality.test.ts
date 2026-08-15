import { describe, expect, it } from 'vitest';
import {
  lintColdCallAcknowledgment,
  lintPermissionOpeners,
  lintCorporateJargon,
  lintExcessiveDashes,
  lintSellerVoiceOutput,
} from '@/domain/seller-voice-quality';

// See master prompt Phases 41-43 — the "bad" fixtures should fail this
// lint, the "good" fixtures should pass clean.

const BAD_CALL_SCRIPT =
  "Hi Ryan, this is Aaron from Pacific Office Automation. I know this is a cold call, but do you have 30 seconds so I can tell you why I'm reaching out?";

const BAD_EMAIL = `Hi Ryan,

I hope this email finds you well. I'm reaching out to explore how our comprehensive suite of cutting-edge technology solutions can help your organization optimize operational efficiencies, enhance cybersecurity posture, and streamline workflows.

Would you be open to a brief conversation to discuss how we can leverage our expertise to support your strategic objectives?`;

const GOOD_CALL_SCRIPT =
  "Hi Ryan, this is Aaron Montano with Pacific Office Automation here in San Jose. Reason for my call, I've been working with a few local law firms, including Ferrari Ottoboni and Lathrop GPM, and we've been able to solve some problems across their technology and operations. I'd love to connect, learn a little about your setup, and see if there's anything I can help with on your side.";

const GOOD_EMAIL = `Hi Ryan,

Happy Friday! I just left you a VM and mentioned I'd follow up here as well.

I've had a lot of success working with law firms in Downtown San Jose, most recently Ferrari Ottoboni Caputo & Wunderling, helping with legacy copier contracts, cybersecurity, and keeping billable hours high.

Wanted to see if you have a few minutes next week to compare notes, see what's working, and if there's anything that could be improved on your side.`;

describe('lintColdCallAcknowledgment', () => {
  it('flags "I know this is a cold call"', () => {
    expect(lintColdCallAcknowledgment(BAD_CALL_SCRIPT)).not.toHaveLength(0);
  });

  it('does not flag a script that never mentions it', () => {
    expect(lintColdCallAcknowledgment(GOOD_CALL_SCRIPT)).toHaveLength(0);
  });
});

describe('lintPermissionOpeners', () => {
  it('flags "do you have 30 seconds"', () => {
    expect(lintPermissionOpeners(BAD_CALL_SCRIPT)).not.toHaveLength(0);
  });

  it('does not flag a script with a direct opener', () => {
    expect(lintPermissionOpeners(GOOD_CALL_SCRIPT)).toHaveLength(0);
  });
});

describe('lintCorporateJargon', () => {
  it('flags "leverage", "cutting-edge", "comprehensive suite", "strategic objectives"', () => {
    const issues = lintCorporateJargon(BAD_EMAIL);
    const found = issues.map((i) => i.detail);
    expect(found.some((d) => d.includes('leverage'))).toBe(true);
    expect(found.some((d) => d.includes('cutting-edge') || d.includes('cutting edge'))).toBe(true);
  });

  it('does not flag plain conversational language', () => {
    expect(lintCorporateJargon(GOOD_EMAIL)).toHaveLength(0);
  });
});

describe('lintExcessiveDashes', () => {
  it('flags multiple em-dash-separated clauses', () => {
    const dashy = 'We help companies grow — faster than before — and stay ahead — of the competition.';
    expect(lintExcessiveDashes(dashy)).not.toHaveLength(0);
  });

  it('tolerates a single dash', () => {
    expect(lintExcessiveDashes('Call me at 555-1234 — anytime.')).toHaveLength(0);
  });
});

describe('lintSellerVoiceOutput — full pass', () => {
  it('fails the bad call script fixture (master prompt Phase 42)', () => {
    expect(lintSellerVoiceOutput(BAD_CALL_SCRIPT).length).toBeGreaterThan(0);
  });

  it('fails the bad email fixture (master prompt Phase 41)', () => {
    expect(lintSellerVoiceOutput(BAD_EMAIL).length).toBeGreaterThan(0);
  });

  it('passes the good call script fixture clean (master prompt Phase 44)', () => {
    expect(lintSellerVoiceOutput(GOOD_CALL_SCRIPT)).toHaveLength(0);
  });

  it('passes the good email fixture clean (master prompt Phase 43)', () => {
    expect(lintSellerVoiceOutput(GOOD_EMAIL)).toHaveLength(0);
  });

  it('also checks a rep\'s own saved phrases-to-avoid', () => {
    expect(lintSellerVoiceOutput('Just wanted to circle back on this.', ['circle back'])).toHaveLength(1);
  });
});
