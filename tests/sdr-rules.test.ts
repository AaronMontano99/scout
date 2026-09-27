import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { getPlaybook, getReference, hasPrivateContent, PLAYBOOK_FILES, REFERENCE_FILES } from '@/ai/sdr/playbooks';
import { lintCallCard, normalizeCallCard, stripDashes, stripDashesDeep, type CallCardShape } from '@/domain/call-style';
import { extractZip, isTerritoryZip, parseZips, territoryStatus } from '@/domain/territory';

const ID = { name: 'Aaron', company: 'Harbor Office Systems', location: 'Springfield' };
const ZIPS = ['90010', '90012'];

function sha(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Tamper guard for the private playbooks and reference (never committed;
// they live in private/). Pins their exact text by fingerprint only, so
// nothing sensitive is in this file. Skipped on a machine without them.
// Only update a hash when Aaron explicitly asked for that change.
const PINNED = {
  calls: '128b8e75b22b6be2a30e9a9390fb7ac1950574a3a897c3cd8d052f72544f723b',
  emails: '7a7abaa7fa4dea3e239a4e659c23785b28017dedf9bed7fb6274a9a77c378374',
  hotlist: 'f211dcabe6e42ae698b25ea888c3efe3501bdea5a9eb2966fd372fe9a6b826c8',
  examples: 'dd4d6122dd196712cbe36eee797a1337383e66fa5adc5b3353ec2548f6d1c899',
} as const;

describe.skipIf(!hasPrivateContent())("Aaron's playbooks are non-negotiable", () => {
  it('have not been altered', () => {
    for (const name of Object.keys(PLAYBOOK_FILES) as (keyof typeof PLAYBOOK_FILES)[]) {
      expect(sha(getPlaybook(name)), name).toBe(PINNED[name]);
    }
  });

  it('reference files all load', () => {
    for (const name of Object.keys(REFERENCE_FILES) as (keyof typeof REFERENCE_FILES)[]) {
      expect(getReference(name).length, name).toBeGreaterThan(200);
    }
  });
});

const GOOD: CallCardShape = {
  opening:
    "Dana, Aaron with Harbor Office Systems here in Springfield. Reason for my call, I work with a number of industrial facilities around the Main area, and I wanted to understand how you guys handle physical security and access at that facility.",
  primaryQuestion: 'Dana, for the Springfield facility, are things like cameras and building access handled locally by you, or is that standardized through corporate?',
  followUp: "Are you pretty happy with what you have today, or is there anything you'd change around coverage, access, or managing it?",
  angle: 'Verkada / Brivo facility security',
  meetingBridge: "That's actually why I called. We've been helping local facilities simplify that environment instead of having cameras, access, and support sitting in separate places.",
  meetingAsk: "Let's spend 10 minutes looking at how you handle it today and see if there's anything worth comparing. If everything looks good, we leave it there.",
  voicemail:
    "Dana, Aaron with Harbor Office Systems here in Springfield. I'm reaching out regarding the Northgate Fabrication facility on Main. We work with local manufacturing and distribution sites around physical security and access control, and I wanted to understand how you're handling that at the Springfield location. Aaron at Harbor Office Systems, 408-555-0142.",
  gatekeeper: 'Who owns facility security and building access for the Springfield site, is that local or through corporate?',
  reason: 'Local manufacturing facility on E. Main.',
  hypothesis: 'Security may be handled locally or standardized through corporate. Test it.',
};

describe("Aaron's call rules", () => {
  it('pass the Northgate Fabrication card he approved', () => {
    expect(lintCallCard(GOOD, ID)).toEqual([]);
  });

  it('catch a generic opener, permission ask, work-sounding meeting, and a lazy VM', () => {
    const bad: CallCardShape = {
      ...GOOD,
      opening: 'Hi Dana, how are you today? Do you have 30 seconds?',
      primaryQuestion: 'Who handles your printers? And your cameras?',
      meetingAsk: "Could we set up a full assessment of everything we offer?",
      voicemail: 'Hi, Aaron from HOS, nothing urgent, call me back.',
      gatekeeper: 'Who handles copiers there?',
      angle: 'Copiers, Managed IT, cybersecurity, and Verkada cameras',
    };
    const fields = lintCallCard(bad, ID).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(['opening', 'primaryQuestion', 'meetingAsk', 'voicemail', 'gatekeeper', 'angle']));
    expect(lintCallCard(bad, ID).map((i) => i.detail).join(' ')).toMatch(/nothing urgent/);
  });

  it('allows "don\'t bring up X" in the angle without counting it as a service list', () => {
    expect(lintCallCard({ ...GOOD, angle: "Managed IT only. Don't bring up print, cameras, or phones unless they give you a reason." }, ID)).toEqual([]);
  });

  it('strips dashes everywhere except URLs and fills the callback number', () => {
    expect(stripDashes('IT is outsourced — run from Fremont - not local')).toBe('IT is outsourced, run from Fremont, not local');
    const deep = stripDashesDeep({ a: 'one — two', sources: [{ label: 'x — y', url: 'https://a-b.com/x—y' }] });
    expect(deep).toEqual({ a: 'one, two', sources: [{ label: 'x, y', url: 'https://a-b.com/x—y' }] });
    expect(normalizeCallCard({ ...GOOD, voicemail: 'Aaron at Harbor Office Systems, [phone].' }, '408-555-0142').voicemail).toBe(
      'Aaron at Harbor Office Systems, 408-555-0142.'
    );
  });
});

describe('territory', () => {
  it('is computed from the ZIP, never guessed', () => {
    expect(extractZip('550 Main St #A, Los Angeles, CA 90012-1234')).toBe('90012');
    expect(isTerritoryZip('90012', ZIPS)).toBe(true);
    expect(isTerritoryZip('90099', ZIPS)).toBe(false);
    expect(territoryStatus('', '5225 Oak Ave, Los Angeles, CA 90099', ZIPS)).toBe('no');
    expect(territoryStatus('90010', null, ZIPS)).toBe('yes');
    expect(territoryStatus('', 'Los Angeles, CA', ZIPS)).toBe('unknown');
  });

  it('filters nothing when no territory is configured', () => {
    expect(isTerritoryZip('90099', [])).toBe(true);
    expect(territoryStatus('90099', null, [])).toBe('unknown');
    expect(parseZips('90010, 90012 90010 abc')).toEqual(['90010', '90012']);
  });

  it('requires the rep\'s own opening from Settings', () => {
    expect(lintCallCard(GOOD, { ...ID, company: 'Other Company' }).map((i) => i.field)).toContain('opening');
  });
});
