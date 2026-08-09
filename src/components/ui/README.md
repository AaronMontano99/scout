# src/components/ui

Reusable primitives translating `DESIGN.md`'s in-app design system into
code — colors/type/radius come from the `@theme` tokens in
`src/app/globals.css`; these components just assemble them
consistently so no page hand-rolls button/card/input styling again.

Built: `Button` (primary/secondary/tertiary), `Card` (light/dark),
`Input`/`Textarea`/`Select`, `Skeleton`/`SkeletonText`, `Tabs`,
`Drawer` (built on native `<dialog>` — no dialog library needed for
something this contained).

Domain-specific display components stay where they already were —
`src/components/badges.tsx` (certainty/role/outcome), `priority.tsx`
(priority label, freshness chip), `stat-tile.tsx`, `states.tsx`
(empty state, source chip), `list-row.tsx` — these aren't generic UI
primitives, they're Scout-specific and correctly live separately.

## Deliberately not built

**Toast** — no action in the current product needs a transient
notification; native form/button feedback (a status change, a
disabled state) covers what exists today. **Tooltip** — the native
`title` attribute covers today's needs (e.g. a pinned icon); a real
positioned-tooltip component is easy to add later once a screen
actually needs rich hover content, not worth the complexity now. Both
are exactly the kind of "build for hypothetical future requirements"
`ARCHITECTURE.md` warns against.
