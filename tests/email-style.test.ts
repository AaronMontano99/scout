import { describe, expect, it } from 'vitest';
import { lintEmail, normalizeEmail, normalizeSubject, countWords } from '@/domain/email-style';

const APPROVED = `Hi Jordan,

We spoke a while back when I reached out about your printers, and you mentioned Acme Test Labs didn't really have a need there. One thing I never followed up on was IT. When I originally spoke with Carmen, she mentioned you had a smaller internal IT team.

Not assuming that's still the case, but I was curious how you're handling support today and whether the team is keeping most of it in-house. We've been helping local companies add IT coverage without having to build out additional internal headcount.

Would it make sense to spend 15 minutes comparing how you handle it today?

Thanks,
Aaron`;

const OLD_2024 = `Hi Jordan,

Aaron from HOS here. Hope you're doing well and closing off your week strong. I'm following up with a quick email about a voicemail I had left for you a few days back.

Currently, we are offering a buyout of competitive contracts and discounted equipment costs to help lower overhead expenses. Many companies are taking advantage of this opportunity. In addition to copiers, we offer phones and internet, mailing and postage machines, IT services, and security cameras.

I'd love to meet with you next week to discuss this further. Are you available on Tuesday the 23rd or Thursday the 25th in the morning? Please let me know if either of these times works for you or if there is a better day and time that suits your schedule.

Thanks again, and I look forward to hearing from you!

Best regards,`;

describe('Aaron\'s hard-coded email style', () => {
  it('passes the email he approved', () => {
    expect(lintEmail('Jordan, quick question', APPROVED)).toEqual([]);
  });

  it('flags the 2024 email that got a flat no', () => {
    const rules = new Set(lintEmail('Following up', OLD_2024).map((i) => i.rule));
    expect(rules).toContain('banned_phrase');
    expect(rules).toContain('too_long');
    expect(rules).toContain('service_list');
    expect(rules).toContain('exclamation');
  });

  it('normalizes greeting, sign-off, and dashes without touching the substance', () => {
    const raw = `Hello Jordan,\n\nOne thing I never asked about was IT — Carmen mentioned a small team.\n\n\n\nWould it make sense to spend 15 minutes on it?\n\nBest regards,\nAaron\nHarbor Office Systems`;
    const out = normalizeEmail(raw, 'Jordan', 'Aaron', 'Harbor Office Systems');
    expect(out.startsWith('Hi Jordan,\n\nOne thing I never asked about was IT, Carmen mentioned a small team.')).toBe(true);
    expect(out.endsWith('\n\nThanks,\nAaron')).toBe(true);
    expect(out).not.toMatch(/—|–|\n{3,}|Best regards|Smith/);
  });

  it('falls back to a plain greeting when no first name is known', () => {
    expect(normalizeEmail('Quick note.\n\nThanks,\nAaron', '', 'Aaron')).toBe('Hi,\n\nQuick note.\n\nThanks,\nAaron');
  });

  it('requires one closing question asking for 15 minutes', () => {
    const noAsk = APPROVED.replace('Would it make sense to spend 15 minutes comparing how you handle it today?', 'Let me know your thoughts.');
    expect(lintEmail('Jordan, quick question', noAsk).map((i) => i.rule)).toContain('no_cta_question');
    const vague = APPROVED.replace('Would it make sense to spend 15 minutes comparing how you handle it today?', 'Worth a quick chat?');
    const rules = lintEmail('Jordan, quick question', vague).map((i) => i.rule);
    expect(rules).toContain('cta_not_short_meeting');
    expect(rules).toContain('banned_phrase');
  });

  it('flags bullets, placeholders, and hype subjects', () => {
    const bulleted = APPROVED.replace('Not assuming', '- Not assuming');
    expect(lintEmail('Jordan, quick question', bulleted).map((i) => i.rule)).toContain('bullet_list');
    expect(lintEmail('Unlock savings for Acme Test Labs today', APPROVED.replace('Carmen', '[Name]')).map((i) => i.rule)).toEqual(
      expect.arrayContaining(['placeholder', 'subject_hype', 'subject_too_long'])
    );
  });

  it('passes a question-first email (no meeting ask on purpose)', () => {
    const questionFirst = `Hi Luis,

Thanks for taking my call earlier.

You mentioned you have someone outside the company currently handling the printers, supplies, and paper.

I was curious, do they also manage the equipment contracts and service side, or are they mainly helping with supplies?

The reason I ask is Maya and I had previously spoken about your copier agreements and changing print volume, so I wanted to understand what ended up changing.

Thanks,
Aaron`;
    expect(lintEmail('printers at Delta Precision', questionFirst, 'question')).toEqual([]);
    // The same email judged as a meeting email is (correctly) flagged for having no 15-minute ask.
    expect(lintEmail('printers at Delta Precision', questionFirst, 'meeting').map((i) => i.rule)).toContain('no_cta_question');
  });

  it('passes hard-signal and contract-timing emails in the approved style', () => {
    const hardSignal = `Hi Priya,

Aaron from Harbor Office Systems here in Springfield. We spoke a while back, and I remember you mentioning Brightline handled IT in-house and really didn't have much need on the print side.

I saw you're wrapping up the Brightline user conference this week and have added new AI features into the platform. Curious if anything has changed around how your team handles security monitoring as the platform has evolved.

We can support internal IT teams with 24/7 security monitoring without replacing what they already manage.

Is that worth a 15-minute conversation next week?

Thanks,
Aaron`;
    expect(lintEmail('still handled in-house?', hardSignal)).toEqual([]);
    const contractTiming = `Hi Maya,

Aaron from Harbor Office Systems here in Springfield. We spoke last year when you mentioned a few projects had been pushed out, print volume was down, and your copier contracts were about a year from coming up.

I was curious what ended up happening with those agreements.

Did you renew everything as-is, or has your print volume changed enough that you adjusted the setup?

If you're still running the same equipment and buying toner separately, it may be worth comparing the numbers.

Would it make sense to spend 15 minutes looking at it?

Thanks,
Aaron`;
    expect(lintEmail('copier contracts', contractTiming)).toEqual([]);
  });

  it('cleans subjects', () => {
    expect(normalizeSubject('Re: Jordan — quick question!')).toBe('Jordan, quick question');
    expect(countWords('Jordan, quick question')).toBe(3);
  });
});
