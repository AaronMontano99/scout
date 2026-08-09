# Account Brain

## What it is and isn't

Every account's persistent, cumulative intelligence record — company
basics, what the team knows, people, historical memory, recent
developments, sources, relationship status, call/research history,
corrections, target-list context. **Not a CRM replacement** — see
`PRODUCT_CONSTITUTION.md` hard non-goals and `CRM_WRITEBACK.md`'s
system-of-record rule. Its job is making account intelligence
*understandable*, not storing every field a CRM would.

## One continuous page, not a tab maze

The Call-Ready Brief and the Account Brain are the same page
(`src/app/demo/accounts/[id]/page.tsx`), not separate screens — the
brief is the default ~30-second view, the Brain's full detail (complete
knowledge timeline, all sources, competitor memory) sits behind one
`Disclosure` toggle. Boxing every section into its own card/tab would
recreate exactly the "10 open tabs" problem the product exists to
eliminate (product spec §21-22, `DESIGN.md`'s `brief-section` — no
border, no card chrome, continuous scroll).

## Relationship status changes what's shown, not whether research happens

`Account.relationshipStatus` (`prospect | current_customer |
former_customer | partner | unknown`) changes framing, never suppresses
information. A current customer's brief shows the existing relationship
and product footprint as context — Scout does **not** aggressively
suggest cross-sells (product spec §31); a former customer's brief
foregrounds *why* they left (demo: Delgado Construction Group — left
over slow service response, not price) so a win-back attempt doesn't
repeat the same mistake blind.

## Contract / incumbent timing

Stored as its own shape (`ContractInfo` in `DATA_MODEL.md`, though the
demo fixture currently represents it as a `contract_timing`
`KnowledgeItem` for simplicity — see `src/demo/fixtures.ts`'s
`demo-ki-ridgeline-contract`). Visible, usable by research/scoring, but
never auto-converted into a pitch (product spec §32) — the rep decides
whether renewal timing is worth raising.

## Competitor / incumbent memory

Not a stored table — a live aggregation query over `KnowledgeItem`
rows typed `incumbent_vendor`, scoped strictly to one organization (see
`DATA_MODEL.md`'s "Competitor memory is a query, not a table" and
`SECURITY.md`'s cross-tenant leakage rule). Demo implementation:
`getCompetitorMemory()` in `src/demo/index.ts`, rendered on any account
sharing an incumbent with others (e.g. "SecureGuard Systems" appears
across Ridgeline, Delgado, Northgate, and Ironclad in the demo data —
`tests/demo-fixtures.test.ts` asserts this aggregation works).

## Never destroy history

Superseded knowledge is marked `verification_status = superseded`, not
deleted (`DATA_MODEL.md` §KnowledgeItem, inherited from Phase 1). A
departed contact (demo: Steve Malone at Northgate) stays visible with a
"departed — needs re-verification" flag rather than silently
disappearing — the fact that someone *used to* be the contact is itself
useful institutional memory.
