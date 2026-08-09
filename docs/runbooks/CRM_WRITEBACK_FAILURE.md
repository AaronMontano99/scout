# Runbook: CRM Writeback Failure

Symptom: an approved `PostCallNote` shows `crm_write_status = 'failed'`.

**Status: no live CRM writeback exists yet** (`CRM_WRITEBACK.md`,
Phase 7). Written ahead of need.

## Diagnose

1. The note itself is never lost — `crm_write_status` failing doesn't
   delete `clean_note`/`proposed_account_updates`/
   `follow_up_email_draft` (`DATA_MODEL.md`). Confirm this first; if a
   failed writeback somehow did lose data, that's a severe bug, treat
   as an incident (`INCIDENT_RESPONSE.md`).
2. Check the specific CRM adapter's write-capability declaration
   (`CRM_WRITEBACK.md`) — did the provider actually support
   `pushNote`/`pushContact`/etc. for this customer's CRM, or was a
   write attempted against an unsupported capability?
3. Check for a permissions issue on the CRM side — the connected
   account may lack write permission on the target object type even
   though read access works fine.

## Fix

- Retry once the underlying cause (permissions, transient API error)
  is resolved — writeback is designed to be retryable, the note isn't
  consumed until it succeeds.
- If the CRM object was deleted/renamed on the customer's side between
  approval and writeback, surface that clearly rather than silently
  failing — the customer needs to know their CRM and Scout have
  diverged.

## Golden rule

**Never auto-retry indefinitely without surfacing the failure.** A
customer should never discover weeks later that a batch of approved
notes silently never made it to their CRM.
