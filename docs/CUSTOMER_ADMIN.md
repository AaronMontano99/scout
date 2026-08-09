# Customer Admin

Not one of the five signature experiences (`PRODUCT_UX.md`) — deliberately
lighter treatment than the rep-facing product this phase. Documented so
the eventual build has a clear, small target.

## Scope (customer-side org admins, not the founder)

Members (invite/remove — `USER_ACCESS.md`'s procedures, given a real
UI), Roles (`OWNER`/`ADMIN`/`MANAGER`/`REP` — `SECURITY.md`), Integrations
(connect/disconnect CRM — `CRM_WRITEBACK.md`, `INTEGRATIONS.md`), Usage
(research budget/consumption — `COST_MODEL.md`), Billing (`PILOT.md`,
`docs/runbooks/BILLING.md`), Organization settings, and Selling
Situation definition (`PROSPECTING_ANALYTICS.md`'s org-configurable
qualification criteria — this is the one customer-admin surface with
real product significance, since a wrong or missing definition affects
every rep's analytics).

## Explicit boundary

Normal reps never see these controls — product spec §69. This is an
`OWNER`/`ADMIN`-only surface, enforced by the existing
`src/auth/permissions.ts` matrix once real auth exists (the matrix
already has the right shape — e.g. `organization:manage_members`,
`organization:manage_billing` — see `SECURITY.md`).

## Status

Not built. Nav intentionally omits a "Settings" item until this exists
(`src/app/demo/layout.tsx`'s comment explains why) — an unbuilt nav
destination is worse than no nav item.
