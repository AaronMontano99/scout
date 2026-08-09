# Onboarding UX

Extends `CUSTOMER_IMPLEMENTATION.md`'s architecture with the Phase 4
UI design — documented, not built as code this phase. Onboarding isn't
one of the five signature experiences (`PRODUCT_UX.md`) that had to be
excellent this phase; it's important but secondary to Home/Target
List/Call-Ready Brief/Post-Call/Analytics.

## Steps (progressive, not a 17-step wizard — product spec §68)

```
CREATE WORKSPACE
  ↓
WHAT DOES YOUR COMPANY SELL?        (seeds SalesProfile)
  ↓
SET UP SELLER PROFILE               (rep-level — see SELLER_STYLE.md)
  ↓
TEACH SCOUT YOUR STYLE              (sample scripts/emails/voicemails)
  ↓
UPLOAD TARGET LIST OR CONNECT DATA  (CSV/XLSX first — INTEGRATIONS.md)
  ↓
RESEARCH STARTS
  ↓
FIRST ACCOUNT READY                 (First Value — CUSTOMER_IMPLEMENTATION.md)
```

## Design notes for whenever this is built

- Each step should feel like a real, useful action, not a form field to
  get through — "what does your company sell" directly produces the
  `SalesProfile` that shapes every subsequent brief, so the copy should
  say that, not just ask a generic question.
- Progress should be resumable — a rep closing the tab mid-onboarding
  should not lose what they already entered.
- The visual language is the in-app system (`DESIGN.md`'s In-App
  Application Design System), not the marketing site's editorial
  pacing — this is a working tool from the first screen.
- First Value should be reachable in one sitting for a reasonably-sized
  spreadsheet — see `CUSTOMER_IMPLEMENTATION.md`'s First Value criteria.

## Status

Not built. See `PHASE_4_COMPLETION_REPORT.md`'s Top 10 Next Tasks —
this becomes buildable once real auth (`src/auth/index.ts`'s
`getCurrentAuthContext`) and the CSV/XLSX import UI exist, neither of
which are built yet.
