# Customer Implementation

## The no-consultant flow

```
Signed → Workspace created → Sales context configured → Data imported
  → Users invited → Target List created → First research generated
  → Reps start calling
```

A 20-person B2B sales org with no RevOps must be able to complete this
without a consultant or engineering team touching it — product spec
§77. This is a product requirement, not an aspiration: if any step
needs the founder to manually run a script or query the database, that
step isn't done yet.

## Organization provisioning

On signup: `Organization`, `Membership` (owner), `Plan`/pilot state,
usage limits, research configuration, integration containers (empty),
onboarding state, `first_value_at` (unset — see below). All tenant data
isolated per `SECURITY.md`'s dual-layer model from the first row
written. See `DATA_MODEL.md` for the schema (`organizations`,
`memberships`, plus the Phase 2 `first_value_at` column).

## Implementation modes

**File** (CSV/XLSX) — the universal path, works for every customer
regardless of tooling (`INTEGRATIONS.md`). **CRM** — official supported
integrations only, Phase 7 (`ROADMAP.md`). **Custom** — standardized
API/export options only if strategically justified; no one-off
customer-specific integration code (product spec §79).

## First Value

Defined criteria, recorded once (`organizations.first_value_at`,
`DATA_MODEL.md`): organization exists, one Sales Profile configured,
one Target List created, ≥10 usable accounts, research completed for
at least one account, a call-ready brief available, people/context
available where possible. The whole onboarding flow should optimize
for reaching this quickly — not for completeness of setup. See product
spec §28 (onboarding) and §86.

## What's NOT built yet

The actual onboarding UI/flow, real CRM OAuth connection, and the
import pipeline's UI (`INTEGRATIONS.md`'s CSV/XLSX flow is designed,
not built as a clickable flow yet). This doc and the underlying schema
exist so Phase 3's onboarding work has a concrete target. See
`docs/runbooks/CUSTOMER_ONBOARDING.md` for what the founder does
manually today, before this is self-serve.
