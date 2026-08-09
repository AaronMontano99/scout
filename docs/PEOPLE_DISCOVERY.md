# People Discovery

Extends `PEOPLE_INTELLIGENCE.md` (Phase 2's product rules) with Phase 3
research-engine specifics.

## Multiple people, no forced winner

Discovery inputs (once live — none connected yet): internal CRM
contacts, official leadership/team pages, approved enrichment
providers, press releases, public conference bios where permitted.
Scout surfaces several relevant people per account rather than picking
one "the contact" — product spec §25-26, already implemented in the
data model via multiple `AccountContactRelationship` rows per account
(see `ACCOUNT_BRAIN.md`).

## First-party data outranks generic title inference

If a CRM note says "Cindy handles technology purchasing," that KNOWN
fact must not be casually overridden by "office managers don't usually
own tech decisions" reasoning — product spec §27. The certainty model
(`KNOWN | INFERRED | SUGGESTED` on `AccountContactRelationship`,
`AI_ARCHITECTURE.md`) is what enforces this: a KNOWN row from a CRM
source has no mechanism by which a same-or-lower-tier inference can
silently replace it — only a `resolveConflict()`-eligible newer,
comparably-trustworthy source can (`SOURCE_MODEL.md`), and even then
the old fact is retained as historical, not deleted.

## Employment freshness is its own axis

`contacts.last_verified_at` (Phase 3 addition, `DATA_MODEL.md`) decays
on its own schedule (`RESEARCH_FRESHNESS.md`'s `contact_employment`
category, 60-day window) — independent of whether any specific *fact*
about that person has changed. Demo: Steve Malone at Northgate Builders
— `last_verified_at` over a year old, rendered as "potentially stale"
even though the underlying `KnowledgeItem`/call-outcome evidence about
him hasn't itself changed.

## Professional context has a hard boundary

Legitimate: stated business priorities, operational focus, public
interviews, growth/technology/efficiency posture — professional
framing only. Never: political affiliation, religion, health,
sexuality, ethnicity, family information, or any other sensitive
personal trait (product spec §30, `PEOPLE_INTELLIGENCE.md`). This
boundary applies to any future extraction prompt touching public posts
or profiles — a violation here is a safety bug, not a tone note.

## Role relevance beyond title

Role inference should weigh internal historical notes, current
responsibilities, org size/department, campaign context, and prior
interactions — not title alone (product spec §32). The existing
`role_hypothesis` + `certainty_type` pair on `AccountContactRelationship`
already carries this — a `SUGGESTED` `champion` and a `KNOWN`
`decision_maker` can coexist for the same account without the system
forcing a single "winner."

## What's NOT built yet

No live enrichment/professional-data provider is connected — all
people data in the product today is demo fixture data
(`src/demo/fixtures.ts`) or, once live, first-party CRM/import data.
`EnrichmentProvider`/a future `ProfessionalDataProvider` interface
extension is Phase 4+ work (`ROADMAP.md`).
