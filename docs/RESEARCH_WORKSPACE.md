# Research Workspace

Extends `RESEARCH_ARCHITECTURE.md` (the pipeline/provider design) with
the product-facing rules for how research behaves inside a Target List.

## Progressive, never blocking

A rep should never wait for an entire list to finish researching
before working the first account. Cost control belongs *underneath*
the experience (provider caching, incremental refresh, cheap-model
extraction — see `COST_MODEL.md`) — it must never visibly show up as
"only 10 of 200 accounts researched because that's what we could
afford" (product spec §14, §68). If a real budget constraint ever
forces a visible tradeoff, that's a Council-level product decision
(`PRODUCT_CONSTITUTION.md`), not something a background job silently
enforces.

## Freshness — visible but quiet

`FreshnessChip` (`src/components/priority.tsx`) renders as plain small
text ("updated 8 days ago"), never a badge or a callout — freshness
exists for trust, not for attention (product spec §66, `DESIGN.md`
"freshness-chip"). Persistent memory (call outcomes, corrections, rep
progress) never carries a freshness indicator at all — only genuinely
time-sensitive research does.

## Research again

Manual refresh is always available. If recent research already exists,
show a subtle "Recent research already exists" notice but let the rep
continue anyway (product spec §67) — Scout advises, it doesn't block.
Every refresh is a real `ResearchRun` (`RESEARCH_ARCHITECTURE.md`,
`DATA_MODEL.md`) and gets cost-tracked like any other research request.

## Company identification uncertainty

When entity resolution can't reach `auto_apply` confidence (see
`DATA_MODEL.md` §Entity resolution, `src/domain/entity-resolution.ts`,
ADR-0005), the rep is never blocked from working the account — they
just see a visible warning ("Company match may be inaccurate. Review
recommended.") and can proceed or correct it. Demo example: `src/demo
/fixtures.ts`'s `DEMO_AMBIGUOUS_MATCH`, rendered in
`src/app/demo/accounts/[id]/page.tsx`. The salesperson stays in
control — product spec §15-16.

## Minimum research floor and honest nulls

Attempt (where available): company website/About page, leadership
info, recent meaningful news, internal CRM/account history, existing
contacts. If little exists, say so plainly ("Limited public information
found. Website unavailable.") rather than manufacturing urgency —
product spec §18. Demo examples: Bayview Development and Sunrise
Landscape & Design in `src/demo/fixtures.ts` — both intentionally
low-data, both rendered honestly rather than padded.

## No strong angle is a valid, correct output

If no meaningful trigger exists, the brief says so directly ("No
strong current trigger found") rather than inventing one — product
spec §65. Demo example: Anderson & Sons Construction. This is a
correctness requirement, not just tone — inventing urgency is the kind
of thing that erodes rep trust in Scout permanently once caught.
