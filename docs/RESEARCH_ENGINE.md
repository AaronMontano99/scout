# Research Engine

## Mission

> Give a salesperson the important information they would have
> reasonably wanted to know before calling an account, without
> requiring them to perform the research manually.

Extends `RESEARCH_ARCHITECTURE.md` (Phase 1's provider abstractions and
pipeline shape) and `RESEARCH_WORKSPACE.md` (Phase 2's product-facing
rules) with the concrete engine internals: entity resolution depth,
source tiering, freshness, and the account-level state machine. Per
ADR-0008, none of this required new parallel tables — see
`DATA_MODEL.md`'s Phase 3 Additions.

## What the engine answers

What company is this? What do they do? What matters right now? Has
anything meaningful changed? What does our organization already know?
Who's relevant? What professional context helps? What should the rep
know before dialing? Where did this come from? It does **not** predict
strategy, produce consulting-style reports, diagnose problems with
false certainty, or tell the rep what to sell (`ACCOUNT_BRAIN.md`'s
existing rule, restated: research informs, the rep decides).

## The three constraints, always in tension

**Accuracy** (can the rep trust it), **speed** (can they start calling
soon), **cost** (can Scout research large lists profitably) — see
`RESEARCH_COSTS.md`. No single dimension gets optimized at the other
two's expense.

## Pipeline (extends RESEARCH_ARCHITECTURE.md's stage list)

```
ACCOUNT QUEUED
  ↓
LOAD ACCOUNT + TARGET LIST CONTEXT       (research_runs.target_list_id, requested_focus)
  ↓
LOAD INTERNAL KNOWLEDGE                   (existing KnowledgeItem rows — never re-derive what's already known)
  ↓
RESOLVE COMPANY IDENTITY                  (see ENTITY_RESOLUTION.md)
  ↓
CHECK CACHE / FRESHNESS                   (see RESEARCH_FRESHNESS.md)
  ↓
FETCH OFFICIAL WEBSITE, NEWS, PEOPLE       (parallel where safe — see below)
  ↓
NORMALIZE + DEDUPLICATE SOURCES            (see SOURCE_MODEL.md)
  ↓
EXTRACT FACTS (schema-validated)           (see AI_ARCHITECTURE.md)
  ↓
RESOLVE CONFLICTS                          (see SOURCE_MODEL.md / EVIDENCE_MODEL.md)
  ↓
GENERATE CALL-READY BRIEF                  (see CALL_READY_BRIEF.md)
  ↓
UPDATE accounts.research_status            (see below)
```

## Account-level status (product spec §5-6)

`accounts.research_status`: `queued → identifying → researching →
processing → ready | limited_data | needs_review | failed →
refreshing`. Implemented as an explicit transition graph in
`src/domain/research-status.ts` (`canTransition`,
`nextPossibleStatuses`) — every state has at least one valid next
state, tested in `tests/research-status.test.ts`. `isUsable()` marks
`ready`/`limited_data`/`needs_review` as states a rep can already open
and get value from — partial success is not a blocked state (§46).
`summarizeResearchProgress()` produces the "17 ready / 36 processing /
147 queued / 0 failed" summary from real per-account statuses, wired
into the Target List workspace header
(`src/app/demo/lists/[id]/page.tsx`).

This is deliberately a **different, coarser** field than
`research_runs.status` (the internal job log) — see ADR-0008 for why
they're kept separate rather than merged into one state machine.

## Partial success, always (product spec §46)

If website research succeeds, news succeeds, but people enrichment
fails, the account still becomes usable — the brief shows what
succeeded and says plainly "People data unavailable right now." No
single failed sub-stage fails the whole account. This is why
`research_status` transitions land on `ready`/`limited_data` rather
than `failed` whenever *any* usable evidence exists — `failed` is
reserved for the case where nothing usable came back at all.

## Parallelism and prioritization

Independent sub-stages (website, news, people) run concurrently once
identity is resolved — bounded by provider rate limits and
organization fairness (`JOBS_ARCHITECTURE.md`'s per-org concurrency
keys already cover this; Phase 3 doesn't need a new queue primitive,
just more job types using the existing `JobQueue` interface). Pinned
accounts, first-in-list accounts, and any account a rep explicitly
opens ("Research This Now") should jump ahead of passive background
queue — a priority hint on `JobQueue.enqueue`'s existing
`concurrencyKey`/options shape, not a new scheduler.

## What's NOT built yet

No live pipeline runs — no `ResearchProvider`, `EnrichmentProvider`, or
`AIProvider` is connected (see `PHASE_2_COMPLETION_REPORT.md` and this
phase's own completion report). Every module described above
(`entity-resolution.ts`, `freshness.ts`, `source-quality.ts`,
`research-security.ts`, `research-status.ts`, `brief-quality.ts`) is
real, tested logic ready to be called by a real pipeline once one
exists — see `docs/PHASE_3_COMPLETION_REPORT.md`'s Top 10 Next Tasks.
