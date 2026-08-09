# Entity Resolution

Extends `DATA_MODEL.md`'s original entity-resolution design and
ADR-0005 (conservative auto-merge). Implementation:
`src/domain/entity-resolution.ts`, tested in
`tests/entity-resolution.test.ts` (18 tests).

## Signal priority

1. **Deterministic external ID** — a CRM/enrichment provider already
   resolved this record; trust it (`method: 'deterministic_external_id'`).
2. **Deterministic domain match** — normalized domain equality.
3. **Normalized name + corroborating signal** — name match alone never
   auto-applies; needs a second independent signal (a non-conflicting
   domain, or matching city+postal code).
4. **Fuzzy name match** — token-overlap similarity above 0.5 (tuned
   down from an originally-unreachable 0.8 — see the comment in
   `entity-resolution.ts` and the Phase 2 completion report's note on
   this exact bug). Always routes to review, never auto-applies.
5. **No match.**

Only tiers 1-2 (and normalized-name matches with real corroboration)
ever `auto_apply`. Everything else returns `verdict: 'review'`, which
must create an `AccountMatchCandidate` row — never a silent merge.

## User-facing confidence labels

Internal `MatchResult` (method + verdict + confidence) maps to the
coarser `AccountIdentityStatus` shown in the UI —
`toIdentityStatus()`:

| Internal result | User sees |
|---|---|
| Deterministic match or user-confirmed | `Confirmed` |
| Auto-applied normalized-name + corroboration | `Likely Match` |
| Review verdict, confidence ≥ 0.5 | `Lower Confidence` |
| Review verdict, confidence < 0.5 | `Review Recommended` |
| No match | `Unconfirmed` |

No raw percentage is shown by default (product spec §8) — the label is
the interface; confidence numbers stay internal.

## Identity persists (product spec §9)

Once `identityStatus === 'confirmed'`, `shouldSkipResolution()` returns
true — a routine refresh never re-solves an already-confirmed identity
from scratch. This is what stops Scout from re-litigating "is this the
right ABC Construction" every single research pass.

## User corrections always win (product spec §37)

`confirmIdentityByUser()` returns full confidence, `auto_apply`,
unconditionally — a human decision is never re-scored against the
algorithmic signals above it. See `AI_ARCHITECTURE.md`'s trust rules;
this is the entity-resolution instance of the same principle.

## Demo example

Two accounts in the demo Construction/Landscaping lists carry a
non-confirmed `identityStatus`: Summit Structural (`review_recommended`
— imported as "Summit Construction," 55% match confidence) and
GreenScape Bay Area (`lower_confidence` — imported as "GreenScape,"
68%). The warning banner on both the list workspace and the account
page is driven directly by `account.identityStatus` via
`getIdentityWarning()` in `src/demo/index.ts` — not a hardcoded
special case, so any account can carry this state.
