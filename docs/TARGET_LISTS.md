# Target Lists

## What it is

The persistent, named prospecting workspace — Scout's primary product
object (ADR-0006, superseding Phase 1's `DailyPlan`). A rep works
"Construction" Monday, "Law Firms" Tuesday, returns to "Construction"
Wednesday and finds their exact progress waiting — nothing resets. See
`docs/DATA_MODEL.md` Phase 2 Additions for the `TargetList`/
`TargetListItem` schema and `supabase/migrations/0002_core_product.sql`
for the actual tables.

## Memory rules (non-negotiable)

**Never expires**: worked/skipped status, pins, call outcomes, notes,
list membership. **May refresh**: news, leadership, website content,
public signals — i.e. the account's research, not the rep's progress
through the list. See product spec §11-12's explicit separation of
persistent memory from time-sensitive research, and
`src/domain/target-lists.ts`'s `calculateListProgress` — a pure
function over whatever `TargetListItem` rows exist, with no implicit
reset logic anywhere.

## Research focus is a lens, not a blindfold

A list may optionally declare a `researchFocus` (e.g. "Cybersecurity").
Scout prioritizes that lens in research and briefs but must still
surface materially stronger evidence outside it (product spec §13) —
e.g. "Cybersecurity-specific evidence is limited. Significant
operational expansion was found and may still be useful." Not yet
implemented as live research (see `RESEARCH_WORKSPACE.md` — this
governs the *pipeline*, once a real `ResearchProvider` exists);
captured here as the product rule the pipeline must follow.

## Progressive research, not all-or-nothing

If a rep uploads 200 accounts, the goal is preparing all 200 — but the
rep starts working the moment the first batch is ready ("17 accounts
ready. Continue processing 183 remaining." — product spec §14). This is
a `JOBS_ARCHITECTURE.md` concern (background research jobs, per-account
completion) surfaced in the UI as list rows becoming populated
incrementally rather than the whole list appearing at once.

## Suggested Calls

An ordered subset (~50) of the list's not-yet-worked accounts,
ranked by priority label (never a numeric score) with pins always
sorting first. See `src/domain/target-lists.ts`'s `rankSuggestedCalls`
and `tests/target-lists.test.ts` for the ordering guarantees. Weak data
does not mean "exclude" — `Limited Data`/`Lower Confidence` accounts
still appear, just ranked lower (product spec §35).

## Workspace UI

`src/app/demo/lists/[id]/page.tsx` — header (progress/pins/focus/last-
worked), Industry Pulse (max 3-5 items, or "nothing meaningful," never
a generic industry essay — product spec §19-20), Suggested Calls, All
Accounts. Demo-mode only right now (`DEMO.md`) — same UI, real data,
once Phase 3+ wires it to the actual database and research pipeline.

## What's NOT built yet

Search/filter/sort controls on "All Accounts" (currently a static
list), manual re-ranking beyond pins, cross-list "what should I work
today" view, CSV/XLSX import flow that creates a list end-to-end (see
`docs/DECISIONS.md` deferred items and `ROADMAP.md` Phase 2 vs. Phase
3+ split).
