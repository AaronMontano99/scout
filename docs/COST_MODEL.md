# Cost Model

## Why this is architecture, not an afterthought

A sales-intelligence product where a single account's research costs
several dollars cannot serve a $2M-revenue customer profitably at a
price they'll actually pay (CFO council role, see
`docs/COUNCIL_REVIEW.md`). Cost visibility has to exist from the first
research job, not get bolted on once a bill is a surprise.

## What gets measured (via `UsageRecord`, see `DATA_MODEL.md`)

- Research requests (per `ResearchRun`)
- Individual provider calls (enrichment, web research)
- AI calls, by workload type (extraction/classification/reasoning/
  summarization/embedding — see `AI_ARCHITECTURE.md`)
- Tokens, where the provider reports them
- Enrichment credits consumed
- Account refresh/rescore events
- Storage (uploaded files, generated assets)
- Background job executions
- All of the above, aggregated per Organization

## Cost-control strategies (architectural, not just "be careful later")

1. **Cache before call** — see `RESEARCH_ARCHITECTURE.md`. The single
   highest-leverage cost control: never pay for evidence the org
   already has.
2. **Incremental over full re-research** — rescore/refresh triggers are
   targeted (score near a decision threshold, explicit user action,
   meaningful time elapsed), not a blanket nightly sweep of every
   account in every org.
3. **Deduplication** across providers within a single research run —
   don't pay two vendors to tell you the same fact.
4. **Cheap models for extraction/classification; stronger (more
   expensive) models reserved for reasoning/summarization** where
   quality materially changes the output — see `AI_ARCHITECTURE.md`'s
   workload-keyed model config.
5. **Per-organization research budgets** — a plan tier caps monthly
   research spend; approaching the cap surfaces to the org (not a
   silent hard stop that looks like a bug).
6. **Queue concurrency controls** — one tenant's research burst (e.g.
   a huge CSV import) cannot starve other tenants' background jobs or
   spike shared infra cost unpredictably; see `JOBS_ARCHITECTURE.md`.

## What's explicitly deferred

Exact unit economics (cost-per-account-researched targets, gross
margin targets, plan pricing/tiers) are a pricing decision that needs
real provider-cost data to be meaningful — deferred to `DECISIONS.md`
as an open item, not guessed at during the architecture phase. What's
fixed now is that the *instrumentation* to eventually answer these
questions exists from day one.

## Guardrail

If a future feature can't be built without materially breaking the
"cheap enough to serve a $2M revenue customer profitably" constraint,
that's a CFO-council veto condition (`PRODUCT_CONSTITUTION.md`), not a
detail to work out after launch.
