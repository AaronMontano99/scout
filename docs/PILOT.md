# Pilot

## What a pilot is

A real, working Scout workspace on a subset of a prospective customer's
actual accounts and reps — not a sandboxed trial with fake data. The
pilot workspace **converts directly to the paid workspace** with no
data migration (product spec §51) — this is a hard requirement on the
provisioning model in `CUSTOMER_IMPLEMENTATION.md`, not a nice-to-have.

## Sizing is flexible

One rep, several reps, or a full small team — no single mandated pilot
size. Limits (if any) are configured per pilot: user count, account
count, research usage, duration, integrations (product spec §51). See
`COST_MODEL.md` for the usage-tracking infrastructure this depends on.

## What a pilot measures (and what it doesn't)

**Not** "did you like the AI." **Does** measure: accounts researched,
accounts worked, calls attempted, conversations, who reps actually
reached, meetings booked, selling situations created, opportunities
created, emails drafted/approved/sent, CRM records updated, research/
admin work handled by Scout instead of the rep (product spec §52).
This is exactly what `PROSPECTING_ANALYTICS.md`'s event-sourced funnel
is built to produce — a pilot's renewal/close conversation should be
built entirely from real `AnalyticsEvent` data, never a satisfaction
survey.

## Status subject to plan/billing

`Subscription.status` (`DATA_MODEL.md`, Phase 1) includes pilot as a
state alongside trial/active/past_due/canceled — see
`COST_MODEL.md`/billing notes in `CRM_WRITEBACK.md`'s neighbor doc,
`ARCHITECTURE.md` §Billing. Full Stripe wiring is not built in Phase 2
(`ROADMAP.md` Phase 6) — the state model exists so it's ready when
billing is implemented.

## What's NOT built yet

Any actual pilot-configuration UI, usage-limit enforcement, or
conversion flow from pilot to paid. This doc captures the product
requirement; implementation is Phase 6.
