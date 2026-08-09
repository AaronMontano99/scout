# Research Costs

Extends `COST_MODEL.md` with Phase 3 research-specific cost discipline.

## Tracked (via `research_runs.cost_cents`, `UsageRecord`)

Cost per account, per Target List (`research_runs.target_list_id`, new
in Phase 3 — see `DATA_MODEL.md`), per organization, per source
provider, per AI provider, per research stage (identity/website/news/
people/synthesis), refresh cost specifically (vs. initial research).

## Budgeting philosophy (product spec §78)

Cheap/fast for the first pass (classification, extraction — see
`AI_ARCHITECTURE.md`'s workload-keyed model config). Expensive
synthesis or people enrichment only once cheap evidence justifies it —
never spend premium inference on a company with no website, a
duplicate account, an unresolved identity, or a deleted account.

## Avoiding N+1 explosion (product spec §79)

The real risk with a 200-account Target List is accidental fan-out:
`N accounts × N providers × N pages × N AI calls`. Mitigations, all
already load-bearing in what's built:

- **Cache before call** — `canReuseCache()` (`RESEARCH_FRESHNESS.md`)
  is the single highest-leverage guard; a Friday research pass on a
  Monday-researched account should cost close to nothing for
  slow-changing categories.
- **Identity resolution before enrichment** — `shouldSkipResolution()`
  (`ENTITY_RESOLUTION.md`) stops re-solving a confirmed identity, which
  also stops re-triggering downstream research keyed to identity
  changes.
- **Deduplication** — `deduplicateByContentHash()`
  (`SOURCE_MODEL.md`) collapses the same event reported by 10 outlets
  into one provider-cost-worthy extraction, not 10.
- **Account reuse across Target Lists** — an account appearing in both
  "General Prospecting" and "Cybersecurity" lists shares one Account
  Brain; research isn't duplicated per list (`TARGET_LISTS.md`'s
  reuse rule, `research_runs.requested_focus` records which focus was
  active without needing separate research per list).

## Batching

Where a provider supports it: embeddings, enrichment, classification
requests batch together. Never batch in a way that breaks per-request
error isolation or crosses an organization boundary — tenant isolation
always outranks batching efficiency (`RESEARCH_SECURITY.md`).

## Cost must never visibly degrade the product

Product spec §14/§68: cost control lives *underneath* the experience.
"Only 10 of 200 accounts researched because that's what we could
afford" is a forbidden UX outcome — if a real budget constraint ever
forces that tradeoff, it's a Council-level product decision
(`PRODUCT_CONSTITUTION.md`), never a silent background-job choice.

## What's NOT measured yet

Everything above is a real, implemented strategy with no real cost
data behind it yet — no live provider has been called (see
`PHASE_3_COMPLETION_REPORT.md`). The first live research connection is
also, necessarily, this project's first real unit-economics data
point.
