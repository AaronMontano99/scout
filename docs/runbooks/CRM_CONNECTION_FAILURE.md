# Runbook: CRM Connection Failure

Symptom: a customer's CRM shows disconnected, or sync stopped.

**Status: no live CRM integration exists yet** (`INTEGRATIONS.md`,
Phase 7). This runbook is written ahead of need, for when it does.

## Diagnose

1. Check `integrations.status` (`connected`/`disconnected`/`error`)
   and `last_synced_at`. A large gap between now and `last_synced_at`
   with `status = 'connected'` suggests a silent sync failure — check
   background job logs for the `syncIntegration` job
   (`JOBS_ARCHITECTURE.md`).
2. **Most common cause: expired OAuth token.** Check token expiration
   against `SECURITY.md`'s credential-tracking fields (scopes,
   expiration, connected_by, connected_at). Refresh-token failures
   usually mean the customer revoked access on the CRM side, not a
   Scout-side bug.
3. Check for a CRM-side API change — vendor API versions change
   (`INTEGRATIONS.md`'s "vendors will change" principle) and can break
   a previously-working integration without any change on Scout's end.

## Fix

- Expired/revoked token: customer needs to reconnect — walk them
  through it, don't try to work around it silently.
- Vendor API change: requires a code fix to the specific adapter
  (`src/integrations/<vendor>/`) — isolated to that one adapter by
  design (`ARCHITECTURE.md`'s provider-independence principle), should
  never require touching domain code.

## Customer communication

Tell the customer promptly if their CRM has been disconnected for more
than a day — silent data staleness is worse than an honest "we noticed
this and are fixing it."
