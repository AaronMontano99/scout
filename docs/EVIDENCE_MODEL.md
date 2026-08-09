# Evidence Model

## Six categories, never blended (product spec §38)

`FACT` · `FIRST_PARTY_KNOWLEDGE` · `PUBLIC_EVIDENCE` · `INFERENCE` ·
`SUGGESTION` · `USER_CORRECTION`. These map onto the existing
`KnowledgeItem`/`ResearchFinding` fields rather than requiring a
separate typed model:

| Category | Maps to |
|---|---|
| Fact / First-party knowledge | `origin = 'user_entered' \| 'crm_synced'`, `certaintyType = 'KNOWN'` |
| Public evidence | `origin = 'research_derived'`, `source_id` set, `certaintyType` per source tier |
| Inference | `origin = 'ai_inferred'`, `certaintyType = 'INFERRED'` |
| Suggestion | `origin = 'ai_inferred'`, `certaintyType = 'SUGGESTED'` |
| User correction | `origin = 'user_entered'`, always promotes to `certaintyType = 'KNOWN'` per `confirmIdentityByUser`-style logic |

## Why there's no separate "Claim" table (ADR-0008)

The Phase 3 brief itself floats a normalized Claim model
(subject/predicate/value/source/certainty/temporal validity) while
cautioning "do not over-engineer if KnowledgeItem already solves this
cleanly." It does: `KnowledgeItem`'s `account_id`/`contact_id`
(subject), `type` (predicate), `content`/`structured_value` (value),
`source_id`/`source_reference` (provenance), `valid_from`/
`valid_until`/`observed_at` (temporal), `certainty_type`/
`verification_status`/`supersedes` (trust) already cover every field
the proposed Claim model asks for. See `DECISIONS.md` ADR-0008 for the
full reasoning — this document exists so future readers don't
independently re-propose the same table.

## Conflict handling, not deletion

When evidence conflicts (product spec §36's CFO example), both sides
persist. `resolveConflict()` (`SOURCE_MODEL.md`) decides which is
"current" for *display* purposes; the "historical" side's
`verification_status` becomes `superseded`, never removed. See the
Vantage Point Builders demo example, threaded through
`KnowledgeItem`, `ResearchFinding`, and two `AccountContactRelationship`
rows (one `isCurrent: false` with `validUntil` set).

## Date semantics (product spec §101-102)

`ResearchFinding.relevant_date` (when the event happened) vs.
`retrieved_at` (when Scout found it) are already distinct fields —
this was Phase 1 design, not new. A fact observed in 2019 must never
render as "current" without newer corroborating evidence — the UI
layer (`CALL_READY_BRIEF.md`) is responsible for choosing which
category (current vs. historical) to render a fact under, driven by
`resolveConflict()`'s output, not by simply showing the newest row.

## Estimates stay estimates

Product spec §102: "lease has about 18 months left" observed June 2024
should become an *estimated* renewal date, not a converted exact fact.
`ContractInfo`'s `certainty_type` field (`DATA_MODEL.md` Phase 1
design) exists exactly for this — an estimate is stored as
`INFERRED`/`SUGGESTED`, never silently promoted to `KNOWN` just because
a date got normalized into a calendar value.
