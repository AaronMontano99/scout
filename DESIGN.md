# DESIGN.md — Scout Visual Authority

This file is the visual authority for Scout, per `PRODUCT_CONSTITUTION.md`'s
hierarchy (Product Constitution → Architecture → **DESIGN.md** → product
specs). No second design system should be created. Two parts:

1. **Marketing site** ("Subtle Gradient" system) — source:
   `SCOUT_SUBTLE_GRADIENT_DESIGN_SYSTEM.md`, provided by the founder,
   version `alpha`. Reproduced below with an integration note.
2. **In-app application** (Target List workspace, Call-Ready Brief,
   Account Brain, analytics, admin) — defined further down, in Phase 2.
   Same token set as the marketing site; denser, working-tool patterns
   instead of editorial pacing.

## Status

**Fits `PRODUCT_CONSTITUTION.md` §Design well.** Checked against the
brief's explicit rejections: no glowing AI imagery, no robot imagery,
no generic-purple-AI branding (the one purple, `accent-preview`, is a
narrow semantic tag color, not a brand color — primary is black), no
glassmorphism, no sci-fi interface language, no gratuitous animation
(the system explicitly puts animation timing out of scope and never
documents hover states), no chart-overloaded dashboard aesthetic. The
single sky-blue gradient is explicitly scoped to the hero only and the
system's own "Don't" list forbids reusing it elsewhere — this is
restraint, not the "excessive gradients" the constitution warns against.

**One thing to flag, not fix:** the signature "field-dashboard hero"
composite is a laptop+mobile mockup of *real* Scout product surfaces
(research dashboard, account-intelligence workspace). Per
`PRODUCT_CONSTITUTION.md`'s no-fabrication instinct (extended here from
data to marketing) and the source doc's own "Known Gaps" note ("in-app
Scout workflow and research surfaces are only partially captured via
marketing mockups"), **this hero cannot be built honestly until Phase
3-5 product UI actually exists.** Building a fake product screenshot
before the product is real would be the marketing-site equivalent of
the fabricated-metrics rule this whole codebase otherwise takes
seriously. Treat the hero composite as blocked on real UI, not as
something to mock up with placeholder screens and ship.

**Applies to marketing site only.** The in-app application (behind
auth) may reasonably diverge in density/information-architecture — a
working salesperson's tool and an editorial marketing page have
different jobs — but should stay recognizably the same brand (same
color/type tokens at minimum). That's a Phase 1+ design decision, not
resolved here.

## Where this is wired into code (Phase 0)

- `src/app/globals.css` — colors, radii, and font family tokens as
  Tailwind v4 `@theme` values, generated directly from this doc's
  token table. Spacing intentionally reuses Tailwind's default 4px-based
  scale rather than redefining it — the source doc's spacing tokens
  (4/8/12/16/20/24/32/48px) already line up with Tailwind's
  `1/2/3/4/5/6/8/12` scale; only `section` (96px, `spacing-24`) is a
  named addition.
- `src/app/layout.tsx` — Inter and JetBrains Mono loaded via
  `next/font/google`, exposed as the `--font-sans`/`--font-mono` values
  `globals.css` references.
- No component library (`button-primary`, `hero-band`, `feature-card`,
  etc.) is built yet — those are real UI components that belong to
  Phase 1's application/marketing shell, not Phase 0 tokens. Building
  them now would be exactly the "detailed product pages before
  architecture is used" the Phase 0 mandate warns against.

---

## Overview

Scout's marketing site reads like a quietly-confident field-intelligence
and research platform. The base canvas is **pure white**
(`{colors.canvas}` — #ffffff) with a soft **sky-blue gradient atmospheric
wash** behind the hero band. Near-black ink `{colors.ink}` (#171717)
carries body and display alike. The single brand voltage is **pure
black** (`{colors.primary}` — #000000) for primary CTAs — minimal and
editorial-feeling. A small blue text-link accent (`{colors.text-link}`
— #0d74ce) is reserved for inline body links, never as a CTA.

Type runs **Inter** as the single sans family at modest weights
(display 600, body 400). JetBrains Mono carries every technical data
surface. No custom typeface — the brand trusts Inter's editorial
neutrality.

The brand's strongest visual signature is the **field-dashboard hero**
— a centered laptop + mobile composite showing original Scout
research, account intelligence, and workflow surfaces — over a
sky-blue gradient atmospheric wash. The composite is the page's chrome
instead of an illustration. **(See Status above — blocked on real
product UI existing.)**

**Key Characteristics:**
- Pure white canvas with sky-blue gradient atmospheric backdrop in hero only.
- Single primary CTA: pure black pill at `{rounded.md}` (8px) — compact developer-tool dialect.
- Text-link blue (`{colors.text-link}`) for inline links only — never on a CTA.
- Inter as the single sans family — no custom display typeface.
- JetBrains Mono on every technical data surface.
- Field-dashboard hero with original Scout product surfaces is the brand chrome.
- Hairline + soft drop depth; no atmospheric brand decoration outside the hero.
- 96px section rhythm.

## Colors

### Brand & Accent
- **Black** (`{colors.primary}` — #000000): Primary CTA fill. Used scarcely.
- **Black Active** (`{colors.primary-active}` — #1a1a1a): Press state.
- **Text Link Blue** (`{colors.text-link}` — #0d74ce): Inline body links inside long-form copy. Scoped narrowly — never on CTAs.
- **Legal Link Blue** (`{colors.text-link-secondary}` — #476cff): Inline links inside legal copy footer.
- **Bright Cyan** (`{colors.accent-link-bright}` — #47c2ff): Used very sparingly inside docs widget links.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): Pure white page floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #fafafa): Subtle alternating band.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white card.
- **Surface Strong** (`{colors.surface-strong}` — #f0f0f3): Badges, ecosystem tiles, secondary buttons.
- **Surface Dark** (`{colors.surface-dark}` — #171717): Dark feature cards, code blocks, IDE mockups, featured pricing.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #1a1a1a): One step lighter inside dark cards.

### Atmospheric Backdrop
- **Sky Light** (`{colors.gradient-sky-light}` — #cfe7ff) + **Sky Mid** (`{colors.gradient-sky-mid}` — #a8c8e8): The soft sky-blue gradient wash behind the homepage hero only. Not a brand action color.

### Hairlines
- **Hairline** (`{colors.hairline}` — #f0f0f3): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f5f5f7): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #dcdee0): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #171717): Display, body emphasis.
- **Body** (`{colors.body}` — #60646c): Default running-text — slightly cool gray.
- **Body Strong** (`{colors.body-strong}` — #171717): Same as ink.
- **Muted** (`{colors.muted}` — #999999): Sub-titles.
- **Muted Soft** (`{colors.muted-soft}` — #cccccc): Disabled text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on black CTA.
- **On Dark** (`{colors.on-dark}` — #ffffff): White text on dark cards.
- **On Dark Soft** (`{colors.on-dark-soft}` — #b0b4ba): Muted off-white on dark.

### Semantic
- **Warning** (`{colors.accent-warning}` — #ab6400): Warning text inside docs callouts.
- **Preview** (`{colors.accent-preview}` — #8145b5): "Preview" tag color.
- **Success** (`{colors.semantic-success}` — #16a34a): Confirmation.
- **Error** (`{colors.semantic-error}` — #eb8e90): Validation errors.

## Typography

### Font Family
**Inter** is the single sans family across every text role. **JetBrains Mono** carries every technical data surface. Fallback: `-apple-system, system-ui, sans-serif`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 64px | 600 | 1.05 | -1.92px | Homepage hero h1 |
| `{typography.display-xl}` | 48px | 600 | 1.1 | -1.44px | Subsidiary heroes |
| `{typography.display-lg}` | 36px | 600 | 1.15 | -1.08px | Section heads |
| `{typography.display-md}` | 28px | 600 | 1.2 | -0.84px | Sub-section heads |
| `{typography.display-sm}` | 22px | 600 | 1.25 | -0.5px | Card group titles |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Component titles |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | List labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body |
| `{typography.caption}` | 13px | 400 | 1.4 | 0 | Photo captions |
| `{typography.caption-uppercase}` | 11px | 600 | 1.4 | 0.88px | Section labels, badges |
| `{typography.code}` | 13px | 400 | 1.5 | 0 | Technical data blocks — JetBrains Mono |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | CTA labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu |

### Principles
- **Display weight stays at 600** — confident but not bombastic. Inter at 600 reads cleaner than 700.
- **Negative letter-spacing on display** — -0.5px to -1.92px tracking.
- **JetBrains Mono on every technical data surface.**

### Note on Font Substitutes
Inter and JetBrains Mono are both freely available — the system uses them directly.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** 96px.

### Grid & Container
- Max content width: ~1200px.
- Editorial body: 12-column grid.
- Feature card grids: 2-up at desktop for hero splits, 3-up for benefit grids.
- Ecosystem tile grid: 8-up at desktop.
- Footer: 5-column at desktop.

### Whitespace Philosophy
Generous editorial pacing. The white canvas does not compete with the hero's gradient sky wash; cards inside dense workflow sections sit close (16-24px gap).

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#ffffff) | Body bands, footer |
| Card | `{colors.surface-card}` (#ffffff) | Content cards |
| Hairline border | 1px `{colors.hairline}` | Card outlines |
| Soft drop | `0 4px 12px rgba(0, 0, 0, 0.04)` | Hovered cards (single shadow tier) |
| Atmospheric gradient | Sky-blue radial wash | Hero backdrop only |
| Dark inversion | `{colors.surface-dark}` (#171717) | Dark feature cards, code blocks, featured pricing |

### Decorative Depth
- **Sky-blue gradient backdrop** in the hero only — atmospheric depth without claiming to be a brand color.
- **Field-dashboard composite** as page chrome — laptop + mobile showing original Scout product surfaces.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | CTA buttons, form inputs, ecosystem tiles |
| `{rounded.lg}` | 12px | Feature cards, code blocks, pricing tiers |
| `{rounded.xl}` | 16px | Device mockup cards |
| `{rounded.xxl}` | 24px | Larger atmospheric cards (rare) |
| `{rounded.pill}` | 9999px | Badges only |
| `{rounded.full}` | 9999px | Avatar plates (rare) |

Compact developer-ergonomic radii — 8px CTAs, 12px cards. Pill geometry is reserved for badges, never CTAs.

## Components

### Top Navigation

**`top-nav`** — Background `{colors.canvas}`, text `{colors.ink}`, height 64px. Layout: Scout wordmark left, primary horizontal menu (Platform / Workflows / Research / Pricing / Resources / Showcase), Sign In + Get started CTA right.

### Buttons

**`button-primary`** — Pure black pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (14px / 500), padding 10px × 18px, height 40px, rounded `{rounded.md}` (8px).

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-secondary`** — White card with 1px hairline-strong border. Background `{colors.surface-card}`, text `{colors.ink}`, 1px `{colors.hairline-strong}` border.

**`button-tertiary-text`** — Inline blue text link. Background transparent, text `{colors.text-link}`.

### Hero & Field Dashboard

**`hero-band`** — Background `{colors.canvas}` with a soft sky-blue gradient wash behind the centered headline. Display headline in `{typography.display-mega}` (64px / 600 / -1.92px), subhead in `{typography.body-md}`, single primary CTA, then below — the field dashboard composite.

**`field-dashboard-card`** — A layered laptop + mobile composite showing original Scout product surfaces. Background `{colors.surface-card}`, rounded `{rounded.xl}`. The laptop holds a research dashboard or account-intelligence workspace; the mobile overlay shows a compact field view. This is the page chrome. **Blocked on real product UI — see Status.**

### Cards

**`feature-card`** — Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.title-md}`, rounded `{rounded.lg}`, padding 24px, 1px `{colors.hairline-strong}` border.

**`feature-card-dark`** — Dark variant. Background `{colors.surface-dark}`, text `{colors.on-dark}`. Same shape, dark inversion.

**`workflow-step-card`** — Step in the "Turn research into action" workflow row. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.lg}`, padding 20px. Layout: 32px square `{component.workflow-step-icon}` + step number + label + body.

**`workflow-step-icon`** — Square plate. Background `{colors.surface-strong}`, rounded `{rounded.md}`, 32px size.

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.lg}`, padding 24px. **Cannot be populated honestly until real customers exist — see PRODUCT_CONSTITUTION.md's no-fabrication instinct.**

### Technical Data & Workspace

**`data-block`** — Inline technical data block. Background `{colors.surface-dark}`, text `{colors.on-dark}` in `{typography.code}` (JetBrains Mono 13px), rounded `{rounded.lg}`, padding 20px. White text on dark.

**`workspace-mockup-card`** — Stylized research workspace mockup. Background `{colors.surface-dark}`, rounded `{rounded.lg}`. Multi-pane intelligence view + activity preview.

### Pricing

**`pricing-tier-card`** — Standard pricing tier. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding 32px, 1px `{colors.hairline-strong}` border.

**`pricing-tier-featured`** — Featured tier. Background `{colors.surface-dark}`, text `{colors.on-dark}`. Same shape, dark inversion.

### Ecosystem

**`ecosystem-tile`** — Square logo plate for partner, data-source, and integration marks. Background `{colors.surface-card}`, rounded `{rounded.md}`, 64px size, 1px `{colors.hairline}` border.

### Forms & Tags

**`text-input`** — Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.md}` (8px), padding 12px × 16px, height 44px, 1px `{colors.hairline-strong}` border. Focus thickens border to 2px ink.

**`badge-pill`** — Small uppercase pill. Background `{colors.surface-strong}`, text `{colors.ink}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 10px.

### CTA / Footer

**`cta-band`** — Pre-footer band. Background `{colors.canvas}`, centered display headline in `{typography.display-lg}`, single black pill CTA. 96px padding.

**`footer-light`** — Closing white footer. Background `{colors.canvas}`, text `{colors.body}`. 5-column link list. 64×48px padding.

**`footer-link`** — Background transparent, text `{colors.body}`, type `{typography.body-sm}`.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (black) for primary CTAs.
- Use `{colors.text-link}` (blue) for inline body links only — never on CTAs or buttons.
- Set every CTA at `{rounded.md}` (8px) — developer dialect.
- Use Inter at weight 600 for display, 400 for body.
- Render every technical data surface in JetBrains Mono.
- Pair the hero with the field-dashboard composite — it's the page chrome (once real product UI exists to show — see Status).

### Don't
- Don't introduce a saturated brand action color. Black is the only CTA fill.
- Don't use blue (`{colors.text-link}`) on a CTA. Inline links only.
- Don't drop display below weight 600 or above 700.
- Don't use full pills on CTAs — pills are for badges only.
- Don't replicate the sky-blue gradient backdrop outside the hero.
- Don't extract a CTA color from a third-party widget (cookie consent, OneTrust). The brand's CTA is what appears on actual page CTAs.
- Don't mock up fake product screens for the field-dashboard composite before real UI exists — see Status.
- Don't populate testimonial cards before real customers exist — see `PRODUCT_CONSTITUTION.md`.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 64→32px; field dashboard → single iPhone screen; feature grid 1-up; nav hamburger. |
| Tablet | 640–1024px | Hero h1 48px; field dashboard compresses; feature grid 2-up. |
| Desktop | 1024–1280px | Full hero h1 64px; full MacBook + iPhone composite; feature grid 3-up. |
| Wide | > 1280px | Content caps at 1200px. |

### Touch Targets
- Primary CTA at 40px height — at WCAG AA, padded for AAA.
- Search input 44px — at AAA.

### Collapsing Strategy
- Top nav switches to hamburger below 768px.
- Field-dashboard laptop + mobile composite collapses to a single mobile preview on mobile.
- Feature grid: 3-up → 2-up → 1-up.
- Ecosystem tile grid: 8-up → 4-up → 3-up → 2-up.

## Iteration Guide

1. Focus on a single component at a time.
2. CTAs default to `{rounded.md}` (8px). Cards use `{rounded.lg}` (12px).
3. Variants live as separate entries.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state never documented.
6. Inter 600 for display, Inter 400 for body. JetBrains Mono on code.
7. Black stays the only CTA color; text-link blue stays inline-only.

## Known Gaps

- Inter and JetBrains Mono are freely available — no licensing concerns.
- Animation timings (field-dashboard parallax, hero entrance) out of scope.
- In-app Scout workflow and research surfaces are only partially captured via marketing mockups — **and don't exist as real UI yet at all (Phase 0/1)**, see Status above.
- Form validation states beyond focus not visible on captured surfaces.

---

# In-App Application Design System (Phase 2)

Defined now because Phase 2 builds real in-app screens (Target List
workspace, Call-Ready Brief, Account Brain, post-call flow). Same
token set as the marketing site above — same brand, different job. A
working salesperson's tool during a calling block needs to be denser,
faster to scan, and quieter than an editorial marketing page. No new
colors are introduced beyond what's already defined above.

## Principles specific to the app shell

- **Density over whitespace.** Marketing spacing (96px section rhythm)
  does not belong here. In-app default vertical rhythm is
  `{spacing.base}`–`{spacing.lg}` (16–24px) between elements, not 96px
  between sections.
- **Scannable in 30 seconds.** The Call-Ready Brief's whole reason to
  exist is "don't make the rep read a report" (`PRODUCT_UX.md`) — every
  in-app pattern below defaults to compact and defers detail behind
  progressive disclosure rather than showing everything at once.
- **No fake precision.** Per the product spec, Scout never shows
  invented numeric scores (`87/100`). Confidence/priority render as
  short text labels (`Strong Context`, `Limited Data`) or a small
  colored dot, never a percentage that implies false precision.
- **Certainty is a first-class visual state**, not an afterthought —
  KNOWN / INFERRED / SUGGESTED must be visually distinct at a glance
  (see Certainty Badge below), because presenting an inference as fact
  is a product-trust failure per `AI_ARCHITECTURE.md`.

## App Shell

**`app-nav-rail`** — Left-aligned vertical nav, background
`{colors.canvas}`, 1px `{colors.hairline}` right border, ~72px collapsed
/ ~220px expanded. Items: Home, My Lists, Accounts, People, Imports,
Analytics, divider, Team, Settings. Active item: `{colors.surface-strong}`
background pill behind the label, text `{colors.ink}`; inactive: text
`{colors.body}`. No icon-only nav without labels — reps switching
contexts fast need words, not glyphs to decode.

**`app-topbar`** — Height 56px (shorter than marketing's 64px
`top-nav` — screen real estate matters more in-app), background
`{colors.canvas}`, bottom 1px `{colors.hairline}`. Holds: current
context breadcrumb (e.g. "Construction — Bay Area"), global search,
user menu.

**`app-content`** — Max width unconstrained (unlike marketing's
1200px cap) — working screens use available width; internal content
groups still respect a readable measure for brief text (~680px) within
wider layout containers.

## List & Table Patterns

**`list-row`** — Compact row for the Target List "All Accounts" view.
Background `{colors.surface-card}`, 1px `{colors.hairline}` bottom
border (not a full card border — rows in a list share edges), padding
`{spacing.sm}` `{spacing.base}` (12px 16px), hover background
`{colors.canvas-soft}`. Contents: company name (`{typography.title-sm}`),
location, priority label, freshness chip, worked/pinned indicator,
right-aligned outcome-if-any.

**`priority-label`** — Text-only tier indicator, not a numeric score.
Values: `Strong Context` / `Useful Context` / `Limited Data` / `Lower
Confidence`. Rendered as `{typography.caption}` in `{colors.body}` with
a small 6px dot in a mapped color (strong → `{colors.semantic-success}`,
useful → `{colors.text-link}`, limited → `{colors.muted}`, lower →
`{colors.accent-warning}`) — dot is a glance-level signal, label is the
actual information; never dot-only.

**`freshness-chip`** — `{typography.caption}`, `{colors.muted}`, no
background (text-only, not a badge — freshness is ambient trust
metadata, not a callout, per the product spec's "should remain visually
subtle" rule). Format: "updated 8 days ago" / "checked today."

## Certainty & Role Badges

**`certainty-badge`** — `{typography.caption-uppercase}`, rounded
`{rounded.pill}`, padding 2px 8px (smaller than marketing's
`badge-pill`). Three fixed values, fixed colors — never remapped per
theme, because consistent recognition matters more than per-page
styling here:
  - `KNOWN` — background `{colors.surface-strong}`, text `{colors.ink}`
  - `INFERRED` — background transparent, text `{colors.body}`, 1px
    `{colors.hairline-strong}` border
  - `SUGGESTED` — background transparent, text `{colors.muted}`, 1px
    dashed `{colors.hairline}` border (dashed = weakest confidence,
    reserved for this one state)

**`role-badge`** — Buying-role label (Decision Maker / Economic Buyer /
Champion / Influencer / Technical Buyer / Blocker / Unknown). Same pill
shape as `certainty-badge`, background `{colors.surface-strong}`, text
`{colors.ink}`. Always paired with a `certainty-badge` — never shown
alone (a role without certainty is exactly the "inference presented as
fact" failure mode).

**`outcome-badge`** — Call outcome label (Voicemail, Gatekeeper,
Connected, Meeting Booked, etc.). Same pill shape; `Meeting Booked` and
`Connected` use `{colors.semantic-success}` text on
`{colors.surface-strong}`; `Not Interested`/`Wrong Contact` use
`{colors.body}` (neutral, not red — a disqualified account isn't an
error state); all others neutral `{colors.ink}` on
`{colors.surface-strong}`.

## Call-Ready Brief Layout

**`brief-header`** — Company name (`{typography.display-sm}`), location
+ website + professional links as a single `{typography.body-sm}` line
underneath. No card chrome — this is page-level, not a card.

**`brief-section`** — Each of "What They Do," "What Matters," "Recent
Developments," "What Your Team Knows," "People," "Sources," "Talking
Points" is a `brief-section`: label in `{typography.caption-uppercase}`
`{colors.muted}`, content in `{typography.body-md}`, `{spacing.md}`
(20px) vertical gap from the next section, **no border, no card
background** — the brief is one continuous scannable page, not a grid
of boxed widgets. Boxing every section would recreate the "10 tabs"
problem the product exists to eliminate.

**`source-chip`** — Inline, next to a claim. `{typography.caption}`,
text `{colors.text-link}`, no background, external-link affordance.
Clicking opens the source. Every external claim must have one — see
`RESEARCH_WORKSPACE.md`.

**`disclosure-toggle`** — "Show deeper research" control gating
Progressive Disclosure Level 2 (see `RESEARCH_WORKSPACE.md`). Text
button, `{colors.text-link}`, collapsed by default always — deep
research is never auto-expanded, per the "too much reading is a
product failure" rule.

## Stat Tiles (analytics — used sparingly)

**`stat-tile`** — Background `{colors.surface-card}`, rounded
`{rounded.lg}`, padding `{spacing.md}` (20px), 1px
`{colors.hairline-strong}` border. Big number in
`{typography.display-sm}` `{colors.ink}` (not `display-mega` — that's
reserved for the marketing hero), label above in
`{typography.caption-uppercase}` `{colors.muted}`. Every stat tile
showing a rate must display its denominator directly beneath in
`{typography.caption}` `{colors.muted}` (e.g. "6 / 63 calls") — a rate
without a visible denominator is exactly the "fake Engagement Score"
failure mode the product spec forbids.

## Empty & Error States

**`empty-state`** — Centered, `{spacing.xxl}` (48px) vertical padding,
headline in `{typography.title-md}`, one line of `{typography.body-md}`
`{colors.body}` explaining what to do, single `button-primary` CTA.
Never the bare "Nothing here yet 🙂" pattern — every empty state names
the specific next action.

**`error-banner`** — Background `{colors.surface-strong}`, left 3px
border `{colors.semantic-error}`, padding `{spacing.sm}`
`{spacing.base}`, rounded `{rounded.md}`. Text explains what failed and
what the user can do next (retry, contact support, wait) — never a bare
stack trace or generic "Something went wrong."
