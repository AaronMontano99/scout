# Runbook: Customer Onboarding

Manual procedure until `CUSTOMER_IMPLEMENTATION.md`'s self-serve flow
is built (Phase 3+).

## Steps

1. **Create the organization.** Once auth/orgs are live (Phase 1
   implementation, not yet built beyond schema), create the
   `Organization` row and an `OWNER` `Membership` for the customer's
   primary contact.
2. **Configure Sales Profile.** Sit with the customer (or have them
   fill a short form once built) to capture: what they sell, ICP, deal
   size, sales cycle, common buyer/influencer/champion titles,
   objections. This feeds `SalesProfile` (`DATA_MODEL.md`).
3. **Import their data.** CSV/XLSX first — see `INTEGRATIONS.md`'s
   import flow. Watch `import_rows.resolution_status` for a high
   `needs_review` count; that signals messy source data worth flagging
   to the customer rather than silently working around.
4. **Invite users.** Add `Membership` rows for each rep, correct roles
   (`OWNER`/`ADMIN`/`MANAGER`/`REP` — see `SECURITY.md`).
5. **Create the first Target List.** Help them name it meaningfully
   (a real campaign/territory name, not "List 1") — see `TARGET_LISTS.md`.
6. **Trigger research** on the first batch of accounts.
7. **Confirm First Value** (`organizations.first_value_at` set — see
   `CUSTOMER_IMPLEMENTATION.md`'s criteria). If it's not set within a
   day or two of onboarding, something in the flow stalled — check
   `TARGET_LIST_FAILURE.md` / `IMPORT_FAILURE.md` / `RESEARCH_FAILURE.md`.

## Founder judgment call

Until the self-serve flow exists, staying hands-on for the first
handful of customers is correct — it's also how you'll learn where the
self-serve flow needs to be simpler than you'd guess from the product
spec alone.
