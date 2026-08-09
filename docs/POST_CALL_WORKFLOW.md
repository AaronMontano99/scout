# Post-Call Workflow

## The core productivity loop

```
Call ends
  ↓
Rep logs outcome (seconds — CallOutcome, see PROSPECTING_ANALYTICS.md)
  ↓
Rep types/dictates a rough note
  ↓
Scout produces: clean CRM note + proposed account-memory updates +
                follow-up email draft (in rep's saved style)
  ↓
ONE approval
  ↓
Writes to Scout (KnowledgeItem/AccountContactRelationship, always
starting at INFERRED/SUGGESTED, never auto-promoted to KNOWN) and,
where a CRM is connected, to the CRM (see CRM_WRITEBACK.md)
```

No duplicate data entry — this is the single highest-value workflow in
the product spec (§40) and the reason `PostCallNote` exists as a first-
class entity (`DATA_MODEL.md` Phase 2 Additions) rather than being
folded into `KnowledgeItem` directly: it needs its own approval/status
lifecycle before anything it proposes becomes real.

## Demo implementation

`src/app/demo/accounts/[id]/post-call/page.tsx`, driven by
`DEMO_POST_CALL_NOTE` in `src/demo/fixtures.ts` — shows the full
before/after: a messy typed note ("talked to angela direct. owner...")
transformed into a clean note, proposed updates (each tagged
INFERRED/SUGGESTED — see `AI_ARCHITECTURE.md`), a follow-up draft, and
a simulated `crm_write_status`. No live AI or CRM call — see `DEMO.md`.

## Trust rule, restated because it's the whole point of this feature

Nothing in `proposed_account_updates` becomes a permanent
`KnowledgeItem`/`AccountContactRelationship` write until
`approved_at` is set (`DATA_MODEL.md`). The approval step isn't UX
friction to minimize away later — it's the control point that keeps AI
output from silently becoming fact, which is the same trust rule this
entire codebase enforces everywhere else (`AI_ARCHITECTURE.md`).

## What's NOT built yet

Real speech-to-text/dictation input, the actual `AIProvider` call that
performs the raw→clean transformation, the outcome-logging UI itself
(currently only visible as historical data on the account page — see
`ACCOUNT_BRAIN.md`), and the real CRM writeback call (`CRM_WRITEBACK.md`
— architecture exists, no live CRM connected). All Phase 3+/4
(`ROADMAP.md`).
