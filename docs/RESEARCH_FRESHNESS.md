# Research Freshness

Implementation: `src/domain/freshness.ts`, tested in
`tests/freshness.test.ts`.

## Category-based decay, not one global TTL

| Category | Window | Rationale |
|---|---|---|
| `news` | 14 days | Fast-changing — product spec §19 |
| `leadership` | 45 days | Medium-changing |
| `contact_employment` | 60 days | People change jobs, independent of any specific fact about them |
| `company_description` | 90 days | Slow-changing — what they do, where they operate |
| `internal_knowledge` | never (`null`) | Persistent — only superseded by a new entry, never auto-expired |

Configurable data (`FRESHNESS_WINDOWS_DAYS`), not hardcoded deep in
business logic — product spec §19's explicit instruction.

## Smart refresh (product spec §20)

A rep researching an account Monday and returning Friday should not
lose that research. `canReuseCache()` returns true whenever a category
hasn't crossed its staleness window — slow-changing categories
(company description, internal knowledge) stay valid across a whole
work week; fast-changing categories (news) may need a real refresh.
This is what keeps a Target List's accumulated research intact between
sessions rather than re-researching from scratch on every visit — see
`TARGET_LISTS.md`'s memory rules, which this directly implements for
the *research* half (list progress itself is handled separately by
`src/domain/target-lists.ts`, never auto-expiring at all).

## Display — subtle, never a dashboard

`describeFreshness()` produces the exact plain-text a `FreshnessChip`
renders ("checked today," "updated 8 days ago") — no callout styling,
no red/yellow/green traffic-light treatment. Product spec §68: "Do not
make the user read a data-governance dashboard before calling."
Staleness only gets flagged in the text itself ("— potentially stale")
once the window has actually passed, never preemptively.

## People-specific freshness

`contacts.last_verified_at` is tracked independently of any specific
fact about a person — see `PEOPLE_DISCOVERY.md`. A contact not
verified in the `contact_employment` window (60 days) reads as
"potentially stale" without deleting their interaction history — a
former contact remains historically relevant (product spec §69).

## Wired into the UI

`src/demo/index.ts`'s `describeCompanyFreshness()` and
`describeNewsFreshness()` feed `FreshnessChip` components on the
account page's "What They Do" and "Recent News" section headers; each
contact's `freshnessLabel` (from `getContactsForAccount()`) feeds the
People section. All real domain-function output, not decorative
placeholder text.
