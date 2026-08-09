# Runbook: Billing

**Status: Stripe not wired in yet** (`ARCHITECTURE.md` §Billing,
`ROADMAP.md` Phase 6). This is the procedure for when it is.

## Setup (one-time)

1. Create a Stripe account, get API keys, set `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` (never commit — see `.env.example`,
   `SECURITY.md`).
2. Create Products/Prices in Stripe matching the plan tiers (`PILOT.md`
   — Starter/Team/Growth are placeholders, not final).
3. Implement the webhook handler (subscription created/updated/
   canceled, payment failed) — see `docs/runbooks/WEBHOOK SECURITY`
   principles in `INTEGRATIONS.md`'s webhook section (signature
   verification, idempotency, quick ack + queued processing).

## Common issues once live

**Payment failed / past due**: Stripe's dunning handles retries by
default — the founder's job is deciding what Scout does at each
`Subscription.status` transition (does access degrade immediately on
`past_due`, or after a grace period? — a real product decision, not
yet made, escalate to Council per `PRODUCT_CONSTITUTION.md` if it
hasn't been decided when this becomes real).

**Customer disputes a charge**: handle directly in Stripe's dashboard;
never argue with a chargeback via the product — resolve it as a human
conversation first.

**Pilot → paid conversion**: per `PILOT.md`, this must never require a
data migration — same `organization_id`, same workspace, just a
`Subscription.status` change from `pilot`/`trial` to `active`.

## Founder-specific note

As a solo founder, reconcile Stripe payouts against expected MRR
manually on a regular cadence until volume makes that impractical —
catching a billing bug (double-charge, failed webhook that didn't
update status) early is much cheaper than catching it after a dozen
customers are affected.
