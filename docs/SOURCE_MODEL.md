# Source Model

## The 5-tier hierarchy

Implemented as `sources.source_tier` (`supabase/migrations/0003_research_engine.sql`)
and `SOURCE_TIER_LABEL` in `src/domain/source-quality.ts`.

| Tier | Label | Examples |
|---|---|---|
| 1 | First-party internal | Customer CRM, customer notes, user corrections, historical interactions |
| 2 | Official company sources | Official website, About/leadership/careers pages, press releases, filings |
| 3 | High-quality external | Reliable news outlets, regulatory filings, reputable industry publications, approved enrichment providers |
| 4 | Professional public information | Approved/permitted professional profiles, public interviews, conference bios |
| 5 | Lower-confidence web data | Directories, aggregators, unverified listings |

Never exposed to users as a number (product spec §55) — it surfaces
only as which claim wins a conflict, and indirectly through
KNOWN/INFERRED/SUGGESTED certainty on the resulting `KnowledgeItem`/
`ResearchFinding`.

## Source record fields

Extends the Phase 1/2 `sources` table (see `DATA_MODEL.md`) rather
than a new entity: `source_tier`, `publisher_domain`, `title`,
`extraction_status` (`pending | extracted | failed | skipped`), and
`content_hash` (for deduplication). Combined with the pre-existing
`type`, `name`, `url`, `reliability_weight`, `organization_id` — see
ADR-0008 for why these landed as columns, not a new table.

## Conflict resolution

`resolveConflict()` in `src/domain/source-quality.ts` — among evidence
tier ≤ 3 (the trust bar), the most recent wins as "current"; everything
else becomes "historical," never deleted. A tier-5 source can never
override a tier-1/2 source just by being newer (tested explicitly in
`tests/source-quality.test.ts`). If nothing clears the trust bar, falls
back to the best tier available rather than refusing to answer
(product spec §16 — progress over perfection).

Demo example: Vantage Point Builders' CFO — a 2022 CRM note (tier 1)
says John Smith, a 2026 official website finding (tier 2) says Sarah
Lee. The website wins as current per the recency-among-trusted-tiers
rule; the CRM note is retained as historical
(`demo-acr-7`/`demo-acr-8` in `src/demo/fixtures.ts`, rendered on the
account page with a struck-through "superseded" treatment for the
historical contact).

## Deduplication

`deduplicateByContentHash()` collapses the same underlying event
reported by multiple sources (product spec §54's "same news story
across 10 websites"), keeping the strongest-tier source as the
representative. Items without a hash are never deduplicated against
each other — absence of a hash means "we don't know if these are the
same," not "assume they are."

## What's NOT built yet

No live source ever gets fetched — `extraction_status` and
`content_hash` are schema/logic ready for a real pipeline
(`RESEARCH_ENGINE.md`), but nothing populates them yet.
