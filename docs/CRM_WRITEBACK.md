# CRM Writeback

## System of record rule (binding)

**CRM owns**: account identity, contact data, ownership, CRM-native
notes/activities, opportunity information. **Scout owns**: normalized
knowledge, research, Account Brain, source provenance, user
corrections, Target Lists, research state, call preparation, analytics,
recommendations, Seller Style. Scout **never** silently overwrites a
CRM record with a model-generated assumption — see product spec §41,
§43 and `AI_ARCHITECTURE.md`'s trust rules.

## Human approval gates every writeback

Every writeback originates from an explicitly approved
`PostCallNote` (`approved_at` set — see `POST_CALL_WORKFLOW.md`) or an
equivalent explicit user action. No automated background process ever
pushes to a customer's CRM unattended in V1.

## CRMProvider write capabilities

Extends the read-side `CRMProvider` interface from Phase 1
(`RESEARCH_ARCHITECTURE.md`, `src/services/crm-provider.ts`) — write
methods are declared but not implemented in Phase 2 (no live CRM
connection exists yet):

```typescript
export interface CRMWriteCapabilities {
  pushNote(input: { accountExternalId: string; content: string }): Promise<PushResult>;
  pushContact(input: RawCRMContact): Promise<PushResult>;
  pushOutcome(input: { accountExternalId: string; outcomeType: string; occurredAt: string }): Promise<PushResult>;
  pushActivity(input: { accountExternalId: string; summary: string; occurredAt: string }): Promise<PushResult>;
}
```

**Providers declare which of these they actually support** — not every
CRM's API exposes the same write surface. A provider that can't push
contacts, for instance, should say so explicitly rather than the
application discovering it via a failed call. See `INTEGRATIONS.md`'s
adapter-contract-discipline section.

## Idempotency and failure

Every writeback attempt is tracked via `PostCallNote.crm_write_status`
(`not_applicable | pending | written | failed`) — see `DATA_MODEL.md`.
A failed writeback never silently loses the note; it stays visible and
retryable. See `docs/runbooks/CRM_WRITEBACK_FAILURE.md` for the
founder-facing diagnostic process once this is live.

## What's NOT built yet

Every actual vendor adapter (HubSpot, Salesforce, Pipedrive, Zoho —
Phase 7 per `ROADMAP.md`), the OAuth connection flow (`docs/SECURITY.md`
§Secrets, product spec §83), and the real writeback call path. The demo
(`src/demo/fixtures.ts`'s `DEMO_POST_CALL_NOTE`, `crmWriteStatus:
'written'`) simulates the *outcome* of a successful writeback without
any live integration — clearly labeled as simulated in
`src/app/demo/accounts/[id]/post-call/page.tsx`.
