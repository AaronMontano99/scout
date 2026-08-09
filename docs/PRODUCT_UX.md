# Product UX

## The one test every screen has to pass

> What work comes rushing back if Scout disappears?

If a screen doesn't remove real manual work (searching websites, digging
through CRM notes, organizing research, remembering where a rep left
off), it doesn't belong in V1 — see `PRODUCT_CONSTITUTION.md` and the
product spec's closing "Final Product Test."

## Navigation

`Home` (pick up where you left off) · `My Lists` · `Accounts` · `People`
· `Imports` · `Analytics` · divider · `Team` · `Settings`. Implemented
in `src/app/demo/layout.tsx` for the demo shell — the real
(authenticated) app shell in Phase 3+ should keep this structure unless
usability testing says otherwise. Target Lists are central (see
`TARGET_LISTS.md`, ADR-0006) — the nav reflects that, not a generic
CRM-style "Accounts first" hierarchy.

## Home experience

"Pick up where you left off" — the most recently worked Target List,
front and center, with a one-click Continue. Then active lists, then
recent results (real numbers, real denominators — never a chart-heavy
dashboard). See `src/app/demo/page.tsx`. The point is getting the rep
back into productive prospecting in one click, not summarizing their
week.

## Progressive disclosure is a hard rule, not a preference

Every information-dense surface has a **default level** (≈30 seconds
of reading) and an **opt-in deeper level** (≈2-3 minutes). The Call-
Ready Brief (`ACCOUNT_BRAIN.md`) is the clearest example:
`src/components/disclosure.tsx`'s `Disclosure` component is collapsed
by default everywhere it's used, with no exception. "Too much reading
is a product failure" (product spec §22) is treated as literally true,
not as a nice sentiment.

## No fake precision, anywhere

No numeric AI scores in any UI surface. `PriorityLabelChip`
(`src/components/priority.tsx`) renders a fixed label
(Strong/Useful/Limited/Lower Confidence) plus a small color dot — never
`87/100`. Every analytics rate (`StatTile`,
`src/components/stat-tile.tsx`) shows its denominator directly beneath
it. See `DESIGN.md`'s in-app design system for the full rationale.

## User stays in control

Pins always outrank automatic ordering (`rankSuggestedCalls`,
`src/domain/target-lists.ts` — tested in
`tests/target-lists.test.ts`). Scout never auto-advances a calling
sequence, never auto-dials, never decides for the rep when to move to
the next account. See product spec §36-37.

## Empty and error states

Every empty state names the specific next action
(`src/components/states.tsx`'s `EmptyState`) — never "Nothing here yet
🙂." See `DESIGN.md`'s in-app patterns section for the full component
spec and `docs/runbooks/` for what happens operationally when a state
is an error rather than legitimately empty.
