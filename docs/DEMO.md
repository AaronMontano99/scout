# Demo Mode

## Purpose

Instant demonstration without waiting for live research or a
provisioned customer database — the founder should be able to open
`/demo` and show every signature experience in a few minutes, with no
setup. See product spec §49.

## What exists

`src/demo/fixtures.ts` — a complete, internally-consistent fictional
dataset for one fictional company ("Bay Sentinel Security," a
commercial security systems seller) and one fictional rep ("Jordan
Reyes"). `src/demo/index.ts` — the accessor layer UI components import
from (never fixtures.ts directly — see its header comment; this
boundary is what lets a real database-backed implementation replace
demo mode later without touching every component).

Covers every required demo scenario from product spec §94:

| Scenario | Where |
|---|---|
| Messy vs. clean list | Landscaping (messier) vs. Construction lists |
| Ambiguous company match | Summit Structural (`DEMO_AMBIGUOUS_MATCH`) |
| Prospect / current / former customer | Ridgeline / Pacific Rim / Delgado |
| Known vs. suggested stakeholder | Maria Chen (KNOWN) vs. Priya Patel (SUGGESTED) |
| Stale contact | Steve Malone at Northgate (departed, flagged) |
| Current news vs. no news | Ridgeline (office expansion) vs. Anderson (nothing found) |
| Competitor/incumbent memory | "SecureGuard Systems" across 4 accounts |
| Historical notes surviving turnover | Ridgeline's 2021 decision-maker note |
| Post-call update + simulated CRM writeback | Coastal Framing Co full flow |
| Meeting booked + selling situation | Coastal Framing Co |
| Low-data company | Bayview Development, Sunrise Landscape |
| Seller style personalization | `DEMO_SELLER_STYLE` (Jordan's tone/samples) |
| Target List progress | Construction list (mixed worked/skipped/in-progress) |
| Analytics funnel | `DEMO_ANALYTICS_EVENTS`, real denominators throughout |

## Rules

**No real customer or prospect data, ever** — product spec §49. Every
name, company, and scenario in `fixtures.ts` is fictional and should
stay that way; this file should never be edited to include real
prospect research even temporarily.

**Referential integrity is tested** — `tests/demo-fixtures.test.ts`
sweeps every fixture array for dangling references (an item pointing
at a non-existent account, etc.). A demo breaking mid-pitch because of
a typo'd ID is an entirely preventable failure — this test exists
specifically to prevent it.

## Routes

`/demo` (home), `/demo/lists`, `/demo/lists/[id]` (Target List
workspace), `/demo/accounts/[id]` (Call-Ready Brief + Account Brain),
`/demo/accounts/[id]/post-call` (post-call workflow). No auth required
— demo mode is intentionally public within the deployed app so it can
be shown without a login step; see `SECURITY.md` for why this is safe
(no real tenant data reachable through it).

## Live Demo Mode — not yet built

Product spec §50 describes a second mode: running Scout live against a
*prospect's own* 5-10 companies during a real sales call. This requires
the real research pipeline (`RESEARCH_ARCHITECTURE.md`) connected to at
least one live `ResearchProvider` — explicitly Phase 4+ work
(`ROADMAP.md`), not built in Phase 2. Fictional Demo Mode is the
complete substitute until then.
