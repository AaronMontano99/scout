# Prospecting Analytics

## Event-sourced, not pre-aggregated

Every metric traces back to a real `AnalyticsEvent` row
(`DATA_MODEL.md` Phase 2 Additions) — rates are computed at read time
from actual events, never maintained as a counter that can silently
drift from reality. See `src/domain/analytics.ts`'s `computeFunnel`
and `computeRoleReach`, both pure functions, both fully covered by
`tests/analytics.test.ts` including the zero-denominator case (a rate
with no attempts renders as `—`, never `0%` — those mean different
things).

## The funnel

```
Calls Attempted → Conversations → Target Conversations → Meetings Booked
  → Selling Situations → Opportunities → (eventually) Wins
```

Every displayed rate carries its numerator and denominator visibly
(`StatTile`/`formatRate`, `src/components/stat-tile.tsx`) — pickup
rate, call→meeting rate, conversation→meeting rate, target-contact→
meeting rate, meeting→selling-situation rate, selling-situation→
opportunity rate. No metric is shown without its denominator
alongside it; see `DESIGN.md`'s stat-tile spec and product spec §55's
explicit "no fake metrics" rule.

## Role reach

"Who am I actually reaching?" — `computeRoleReach` breaks down logged
`CallOutcome`s by role (gatekeeper rate, decision-maker reach rate,
champion/influencer reach rate, no-answer rate), every rate's
denominator equal to total logged calls. Product spec §54 explicitly
rejects a vague "Engagement Score" in favor of these concrete,
individually-interpretable rates.

## Selling Situation is organization-configurable, not hardcoded

`SellingSituationDefinition` (`DATA_MODEL.md`) holds free-text
qualification criteria per org — no built-in MEDDPICC. Demo default
(`DEMO_SELLING_SITUATION_DEFINITION`, `src/demo/fixtures.ts`) uses the
founder's own framework verbatim: *"Is it a deal? Is it a deal I can
get? Is it a deal I can get this month?"* An org can define a different
one; Scout doesn't assume everyone qualifies deals the same way
(product spec §56).

## Audience-specific views (documented, not all built)

**Rep**: lists worked, calls, conversations, role mix, meetings,
selling situations — self-improvement framing, not surveillance
(product spec §58). **Manager**: team activity, meetings, selling
situations, opportunities, list/campaign performance, coverage — never
minutes-in-app or keystroke-level tracking (§59). **Target List**:
per-list rollup (accounts worked/remaining, calls, conversations,
meetings, selling situations, emails, last worked — §60). Only the
underlying event/outcome data and the pure calculation functions are
built in Phase 2; the manager/rep-specific dashboard *views* are
Phase 3+ (`ROADMAP.md`) — the home page (`src/app/demo/page.tsx`)
shows a first, minimal cut of the rep-facing numbers.

## What's explicitly rejected

A giant BI tool, predictive scoring of reps or roles before real data
volume exists (product spec §62), and any metric that can't be traced
to a real event.
