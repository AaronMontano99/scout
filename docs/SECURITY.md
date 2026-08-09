# Security & Multi-Tenancy

## Threat model, stated plainly

Company A must never see Company B's accounts, contacts, notes,
research, scores, or plans — including via a bug, a slow query someone
copy-pasted without a `WHERE`, a background job that forgot a tenant
filter, a log line, an embedding search, or an admin debugging tool.
Customer sales data is confidential business information; treat it
with the same seriousness as credentials.

## Defense in depth: two independent layers, not one

1. **Application-level authorization** — every server action / route
   handler resolves the caller's `Membership` (org + role) from the
   authenticated session and scopes every query by `organization_id`
   explicitly. Never rely on a client-supplied `organization_id`.
2. **Postgres Row-Level Security** — every tenant-owned table has RLS
   enabled with a policy keyed to `organization_id = current_setting/
   auth claim`. This is the backstop for the case where application
   logic has a bug — RLS makes a missing `WHERE organization_id = ...`
   fail closed instead of leaking data.

**Both layers are required.** App-level checks alone are one bad
merge away from a cross-tenant leak; RLS alone is one raw-SQL
debugging query away from the same thing. Neither is optional. This
was a specific council disagreement (CTO wanted RLS-only for
simplicity, resolved toward both — see `docs/COUNCIL_REVIEW.md`).

RLS policies are written in portable SQL (not Supabase-proprietary
helpers beyond the standard `auth.uid()`-style claim access) so a
future migration off Supabase doesn't require rewriting the tenancy
model from scratch — see `ARCHITECTURE.md` ADR-0002.

## Authentication

Supabase Auth, wrapped behind an internal `src/auth` module — call
sites use Scout's own `getCurrentMembership()`/`requireRole()` helpers,
never the Supabase client directly, so auth can be swapped later
without touching every route.

## Authorization / roles

`OWNER > ADMIN > MANAGER > REP`, resolved per-request from
`Membership`, centralized in `src/auth/permissions.ts` — a single
source of truth for "can this role do this action," not scattered
`if (role === 'ADMIN')` checks across UI components. UI-level hiding
of controls is a UX nicety; it is never the authorization mechanism.
Every mutating server action re-checks permission server-side
regardless of what the UI already hid.

Territory/team-scoped visibility (a Manager sees their team's accounts,
not the whole org) is architected into the permission layer's shape
from day one (a `scope` concept alongside `role`) even though V1 may
ship with looser default visibility — see `ROADMAP.md`. Retrofitting
scope-based visibility into a permission system that only ever checked
role would be expensive; designing the interface for it now is cheap.

## Secrets

- No secret (API key, OAuth token, Stripe key, Supabase service role
  key) is ever committed. `.env.example` documents variable names with
  placeholder values only.
- `Integration.credentials_ref` stores a reference into a secrets
  store, never a raw token in the primary database — see
  `DATA_MODEL.md`.
- Server-only secrets never ship to client bundles — enforced by
  Next.js's server/client boundary discipline (no `NEXT_PUBLIC_`
  prefix on anything sensitive) plus a lint rule once the codebase
  exists.

## Data ownership

Customer data belongs to the customer. Architected for (not all fully
built in Phase 0, but the model must not preclude them):

- **Export** — an organization can export its Accounts/Contacts/
  KnowledgeItems/Interactions in a usable format.
- **Deletion** — organization offboarding removes/anonymizes data per
  a defined retention policy (TBD — `DECISIONS.md` deferred item).
- **Employee removal** — removing a Membership revokes access
  immediately; it does not delete that person's authored
  KnowledgeItems (those belong to the org, not the individual — see
  `PRODUCT_CONSTITUTION.md` institutional-memory principle).
- **Integration revocation** — disconnecting a CRM/enrichment
  integration stops future syncs; historical data already ingested
  stays (it's now the org's institutional memory), unless the customer
  explicitly requests removal.
- **No cross-customer model training.** Customer data is never used to
  train or fine-tune a shared model across organizations without a
  future, explicit, opt-in policy that does not exist today. This is a
  hard constraint, not a roadmap item to eventually relax by default.

## Auditability

`AuditLog` (see `DATA_MODEL.md`) is append-only from day one. Phase 0
doesn't need a full audit UI, but every sensitive action (login,
import, deletion, integration connect/disconnect, role change,
research run, AI-generated conclusion reaching KNOWN-adjacent
visibility, manual fact verification, account merge) writes a row
regardless of whether anyone's looking at it yet — retrofitting audit
coverage after the fact means gaps in exactly the period you'd want to
investigate.

## Compliance readiness (not full compliance in V1)

V1 does not need SOC 2 or a compliance program. The architecture
should not make one *harder* later: tenant isolation, audit logging,
access control, and data-handling discipline above are exactly the
controls a future SOC 2 Type II would ask about — building them now as
correct defaults costs little; retrofitting them under audit pressure
later costs a lot.

## Third-party dependency risk

Every `EnrichmentProvider`/`ResearchProvider`/`CRMProvider` receives
only the minimum data needed for its specific call — not a full
account/contact dump "just in case." Vendor breach blast radius should
be bounded by what that vendor was actually sent, which is itself
bounded by the provider interface's method signatures (see
`RESEARCH_ARCHITECTURE.md`).
