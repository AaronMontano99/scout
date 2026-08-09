# Call-Ready Brief

Extends `ACCOUNT_BRAIN.md` and `PRODUCT_UX.md` with the Phase 3
research-engine-specific rules for what makes a brief trustworthy, not
just well-formatted.

## Format (unchanged from Phase 2, now backed by real research rules)

Company header → What They Do (1-2 sentences) → What Matters (3-5
bullets) → Recent Developments (0-3 items) → What Your Team Knows →
People → Talking Points → Sources, inline but subtle. ~30 seconds of
reading by default; deeper research behind one `Disclosure` toggle
(`src/components/disclosure.tsx`) — see `DESIGN.md`'s in-app system.

## The trust test before READY (product spec §107)

Before an account transitions to `research_status = 'ready'`, the
pipeline should be able to answer yes to all of:

- Can each important factual claim be traced to a source?
- Is the company identity reasonably confirmed (`identity_status`)?
- Are uncertainty labels applied (KNOWN/INFERRED/SUGGESTED, never blended)?
- Are historical details distinguished from current ones (`SOURCE_MODEL.md`)?
- Is it concise (`AI_EVALUATIONS.md`'s brief-quality lint)?
- Is it actually useful to a rep, not just technically complete?

If no: the account stays in `processing`, or lands on `limited_data`/
`needs_review` rather than a falsely-confident `ready`.

## No strong angle is a valid, complete output

"No strong current trigger found" (Anderson & Sons Construction in the
demo) is not a failure state — it's an honest one. Never manufacture
urgency to fill the section (product spec §18, §65).

## Company-specific evidence beats generic industry theory

If real evidence exists about *this* company, it leads. Generic
industry framing ("construction companies often struggle with...") is
explicitly de-prioritized — product spec §58. The demo's Industry Pulse
section (`src/app/demo/lists/[id]/page.tsx`) is capped at 2-3 items
specifically to keep this secondary to account-level content.

## Talking points vs. talk track

Talking points are short, evidence-linked prompts for the rep's own
judgment — not a script. An optional 30-50 second talk track
(`AccountBrief.talkTrack` in `src/demo/fixtures.ts`) is generated only
after research is complete and only in the rep's `SellerStyleProfile`
voice (`SELLER_STYLE.md`) — never invented independently of the
underlying evidence (product spec §63). Talk-track safety rule:
professional relevance only, never "I saw you posted..." — see the
demo Ridgeline talk track for the accepted register ("I saw Ridgeline's
opening a new San Jose office...").

## What's NOT built yet

No live brief generation — every demo brief is hand-written content
standing in for what an `AIProvider.summarize`/`reason` call would
produce (`DEMO.md`). The trust-test checklist above is a design
contract for that future pipeline, verified today only against
hand-written content via `AI_EVALUATIONS.md`'s lint.
