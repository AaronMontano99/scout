# Runbook: Research Cost Spike

Symptom: `UsageRecord`/provider billing shows a sudden jump in research
spend.

## Diagnose, in order of likelihood

1. **Caching bug** — the single most likely cause per
   `RESEARCH_COSTS.md`. Check whether `canReuseCache()`
   (`src/domain/freshness.ts`) is actually being honored before
   provider calls, or whether accounts are being re-researched despite
   being within their freshness window. Compare `ResearchRun` creation
   rate against actual new/changed accounts — a spike with no
   corresponding spike in new accounts or explicit refresh requests is
   almost always a cache-bypass bug.
2. **Entity resolution re-running unnecessarily** — check
   `shouldSkipResolution()` is being respected for `confirmed`
   identities; re-resolving on every pass silently multiplies
   downstream research cost too.
3. **A large import/Target List genuinely arrived** — a legitimate
   200-account list will cost roughly 200x a single account; check
   whether the spike lines up with a real `Import`/`TargetList`
   creation event before assuming it's a bug.
4. **Deduplication not firing** — check `content_hash` population on
   `sources`; if it's null for content that should have a hash,
   `deduplicateByContentHash()` (`SOURCE_MODEL.md`) can't do its job,
   and the same news event gets extracted N times.
5. **One organization's usage vs. platform-wide** — scope the spike
   before diagnosing the mechanism; a single customer's spike points at
   their specific list/import, not a systemic issue.

## Fix

Once the mechanism is identified, fix the root cause (cache logic,
resolution logic, dedup) — never just cap spend as a band-aid without
understanding why the spend happened. Per `RESEARCH_COSTS.md`, cost
control must never visibly degrade the product (e.g. secretly
researching fewer accounts) — the fix is making the existing cost
controls actually work, not disabling coverage.

## Prevention

Per-organization research budgets (`COST_MODEL.md`, `PILOT.md`) should
surface an early warning before a spike becomes a bill surprise — not
yet built; until it is, periodic manual review of `UsageRecord`
trends is the mitigation.
