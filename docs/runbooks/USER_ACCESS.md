# Runbook: User Access

## Granting a new user access to an organization

Through the app (once built): invite flow creates a `Membership` with
`status = 'invited'`, role assigned by an `OWNER`/`ADMIN`. Manually
(current state, pre-invite-UI): insert a `Membership` row directly,
double-check `organization_id` and `role` before committing — a wrong
`organization_id` here is a direct tenant-isolation mistake, not a
cosmetic error.

## Changing a role

Update `Membership.role`. Re-verify the change took effect by checking
`src/auth/permissions.ts`'s `can()` output for that role against the
actions the user should/shouldn't have — see `SECURITY.md`. Log the
change in `AuditLog` (required for any role change per `SECURITY.md`
§Auditability).

## Removing a user

Set `Membership.status = 'removed'` — **do not delete the row**. Their
authored `KnowledgeItem`s and other contributions stay (they belong to
the organization, not the individual — `PRODUCT_CONSTITUTION.md`'s
institutional-memory principle). Access should be revoked immediately
— verify by confirming `current_user_organization_ids()`
(`0001_init_tenancy.sql`) no longer returns that org for the removed
user's queries.

## Granting Founder Operations Console access (platform admin)

**Never self-service.** Set `app_users.platform_admin = true` directly
in the database (ADR-0007, `FOUNDER_OPERATIONS.md`) — there is
deliberately no UI path to grant this to yourself or anyone else. Log
who did it, when, and why outside the product (this doc, a personal
log, whatever the founder actually uses) since it's not an app-level
audited action by design.

## Suspected unauthorized access

Treat as an incident — see `INCIDENT_RESPONSE.md`. Check `AuditLog` for
the affected organization first; RLS should make cross-tenant access
structurally impossible (`SECURITY.md`), so evidence of it happening
anyway is a serious bug, not routine cleanup.
