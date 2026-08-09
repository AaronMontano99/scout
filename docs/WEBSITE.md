# Website

Extends `DESIGN.md`'s marketing-site system with Phase 2's product
messaging. Not built as code yet (`ROADMAP.md` Phase O — website comes
after the product underneath is real, per the source brief: "do not
build the marketing shell while the product underneath is fake").

## Core messaging (candidates, not finalized)

Headline candidates: *"Research less. Sell more."* / *"Turn your target
list into a prospecting plan."* / *"Your team already knows more than
you think."* Supporting line: *"Upload the companies you want to
target. Scout researches them, organizes what your team already knows,
and gives your reps the context they need to start calling."*

**Avoid**: "agentic AI revolution," "10X your revenue," "AI-powered
sales transformation" — see `PRODUCT_CONSTITUTION.md`'s "we do not sell
AI" positioning. Sell the outcome (more prepared calls, more meetings),
never the mechanism.

## Story flow (candidate structure)

```
BRING YOUR LIST — Upload Excel or connect existing systems.
SCOUT DOES THE HOMEWORK — Websites, public research, people, existing account knowledge.
START CALLING — Important context without five open tabs.
RECORD WHAT HAPPENED — One clean workflow.
SCOUT REMEMBERS — Organizational account knowledge grows.
MEASURE THE OUTCOME — Meetings, selling situations, opportunities.
```

Maps directly to the five signature experiences already built in demo
form: Target List workspace, Call-Ready Brief, Account Memory, Post-
Call flow, Prospecting ROI (`PRODUCT_UX.md`).

## Complementary positioning

*"Keep your CRM. Keep ZoomInfo. Keep Sales Navigator."* Scout sits
between scattered information and the next call — it does not require
replacing a customer's existing stack (`INTEGRATIONS.md`,
`PRODUCT_CONSTITUTION.md` hard non-goals).

## The field-dashboard hero — still blocked

`DESIGN.md`'s signature hero composite (laptop + mobile showing real
Scout surfaces) remains blocked on real, launchable in-app UI existing
— the Phase 2 demo-mode pages (`/demo/lists/[id]`,
`/demo/accounts/[id]`) are a plausible source for that composite once
they're no longer demo-only, but using them before the product is real
would be exactly the fabricated-screenshot problem `DESIGN.md` already
flags. Revisit once Phase 3+ ships a real (non-demo) version of these
screens.

## Pricing (experimental, not load-bearing)

Starter ~$199/mo, Team ~$499/mo, Growth ~$999/mo — placeholders per
product spec §89, intentionally not hardcoded into any business logic
(`COST_MODEL.md`, `ARCHITECTURE.md` §Billing). Real pricing needs real
unit-economics data first.

## Status

Not built. Route structure (`/`, `/product`, `/pricing`, `/security`,
`/login`) already anticipated in Phase 1's `ARCHITECTURE.md` §26; no
implementation until the underlying product has something true to show.
