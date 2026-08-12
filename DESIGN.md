# SCOUT — DESIGN.md
## Marketing Visual System + Scroll-World Design Integration
### DESIGN-ONLY SPEC — EXISTING COPY / PITCHES ARE LOCKED

---

# AMENDMENT — 2026-08-12 — Purple rebrand, new mark, new homepage reference

The product owner supplied a new reference mockup (Scout marketing
homepage: nav, hero, "Scout every day" section) and asked for a full
rebuild to match it. This supersedes the sections below wherever they
conflict:

- **Brand accent moves from Scout Blue (`#2F80FF`) to Scout Purple**
  (`#6D3FD1` primary / `#4C1D95` deep-hover / `#EDE7FB` soft wash /
  `#F6F3FE` atmospheric page wash). Purple plays the same restricted
  "signal, not wallpaper" role blue used to play in §7 — links, icons,
  small highlighted words, secondary accents. Primary CTAs stay
  black/near-black per §8's existing product-vs-marketing logic; that
  part of §8 is unchanged.
- **Logo mark moves from the compass-ring + diamond mark to a
  four-point sparkle/north-star mark** paired with a serif "Scout"
  wordmark. See `src/components/marketing/logo.tsx`. §3's "do not
  animate/glow/gradient the logo" rules still apply to the new mark.
- **Hero and the "Scout every day" feature section adopt the new
  mockup's copy verbatim** (kicker "_INTELLIGENT TERRITORY™", headline
  "Find your next best account.", the three Daily Briefs / Account
  Signals / Territory Map cards, etc.) — §0's copy lock does not apply
  to these two sections; the mockup is now their copy authority. §0's
  copy lock still applies to every section the mockup doesn't cover
  (How Scout Works, Certainty, the dark section, Works With Your
  Stack, the final CTA, the footer) — those keep their existing
  wording, restyled only.
  - Exception inside the exception: the mockup's "Trusted by top
    revenue teams" row names real companies (Ramp, Vanta, Amplitude,
    dbt Labs, Chargebee) as if they were Scout customers. Scout has no
    customers yet (see README "Status"), and §0 separately bans fake
    customer proof — that rule *is* honored. The logo row ships as
    neutral, unnamed placeholder marks instead of those real logos.
- **A serif display font (Fraunces) is added for the hero headline
  only**, layered on top of §9's Inter-only rule — see
  `--font-display` in `globals.css`. Inter remains the family for
  everything else (nav, body, buttons, section titles, product
  surfaces), unchanged from §9.
- Kickers adopt the mockup's underscore-prefixed treatment
  (`_LABEL LIKE THIS`) site-wide for visual consistency — a
  typographic prefix, not a copy change.

Everything else in this file — the compass/direction *concept* behind
the brand, the "quietly confident, product-led" character in §4, the
white-dominant 80/15/5 balance in §7 (now read as white/black/**purple**),
spacing and section rhythm — stands as originally written.

---

# 0. CRITICAL COPY LOCK

This file controls **visual design only**.

It does NOT authorize changes to Scout's messaging, positioning, pitches, wording, product claims, section copy, CTA wording, or narrative.

The current website copy is the source of truth.

Before implementing design changes, inspect the existing website code, especially:

`src/app/page.tsx`

`src/components/marketing/flight-hero.tsx`

`src/components/marketing/nav.tsx`

and any existing marketing components they reference.

## HARD RULE

**Do not rewrite existing copy while implementing this design system.**

Do not:

- rewrite the hero headline
- rewrite the hero subheadline
- rewrite the scroll-flight scene headlines
- rewrite scene body copy
- rewrite value-strip copy
- rewrite "How Scout works"
- rewrite certainty copy
- rewrite the dark-section copy
- rewrite the existing-stack copy
- rewrite final CTA copy
- rename CTAs
- invent new marketing claims
- add fake customer proof
- add fake statistics
- add testimonials
- add new sales language because it "sounds better"
- replace Scout's current positioning with generic AI SaaS language

If a visual treatment requires shorter copy, **change the visual treatment instead of shortening the copy**.

If existing wording wraps awkwardly, adjust:

- width
- font size
- line height
- spacing
- layout

Do not edit the words.

## COPY AUTHORITY

The existing website is the copy authority.

This design file is the visual authority.

If they conflict:

**preserve the existing wording and adapt the design around it.**

---

# 1. EXISTING WEBSITE STRUCTURE IS THE BASE

Do not redesign Scout as an entirely different website.

The existing website already has the correct product narrative and scroll flow.

Preserve the existing major structure unless a purely visual layout refinement is necessary.

Current major experience:

1. Navigation
2. Scroll-flight hero
3. Value strip
4. How Scout Works
5. Certainty section
6. Dark "work around the call" section
7. Works With Your Stack
8. Final CTA
9. Footer

The goal is:

# KEEP THE STORY.
# UPGRADE THE ART DIRECTION.

Scout currently feels intentionally minimal, but parts of it also feel too bare and generic.

The design goal is to add:

- brand identity
- visual rhythm
- directional cues
- subtle depth
- visual storytelling
- a stronger Scout / North Star motif
- more premium section composition

without adding clutter.

---

# 2. BRAND IDEA

Scout's visual identity should be built around:

# DIRECTION + CLARITY + PREPARATION

The brand name "Scout" naturally supports:

- navigation
- field intelligence
- knowing where to look
- finding direction
- locating the next opportunity
- moving from uncertainty toward clarity

The approved visual inspiration is a clean compass-style Scout mark with one blue north-point.

Use that as the core visual metaphor.

The design language should suggest:

> Scout helps the rep find direction inside a messy prospecting workflow.

This should be subtle.

Scout must NOT become:

- an outdoors brand
- a hiking brand
- a navigation app
- military software
- sci-fi software
- a literal map website

The compass / north-star language should appear mostly through geometry and motion.

---

# 3. LOGO DIRECTION

Use the approved Scout compass / north-star logo direction.

## Primary lockup

Compass mark + Scout wordmark.

Use in:

- top navigation
- footer
- product shell where appropriate
- favicon / app mark using symbol only

## Icon concept

The mark communicates:

- direction
- scouting
- location
- north
- precision

The blue north-point is the recognizable brand accent.

## Logo treatment

Primary:

Black / near-black geometry
+
Scout Blue north point
+
black Scout wordmark

Do not:

- animate the logo constantly
- glow the logo
- put the logo in a gradient
- add a circle container around it unless the actual approved asset contains one
- turn it into a giant hero illustration

The logo is a signature, not a decorative object.

---

# 4. OVERALL DESIGN CHARACTER

Scout should feel:

MODERN

CLEAN

SWIFT

PREMIUM

PRECISE

EDITORIAL

QUIETLY CONFIDENT

PRODUCT-LED

INTENTIONAL

The design should look like a serious B2B SaaS company with a disciplined internal design team.

The page should NOT feel like:

- a generic Framer template
- a generic Claude-generated landing page
- a generic AI research startup
- a collection of floating rounded cards

The design distinction should come from:

- layout
- typography
- directional geometry
- subtle navigation motifs
- product presentation
- scroll behavior
- spacing
- section transitions
- controlled blue accents

---

# 5. CORE COLOR SYSTEM

Scout remains primarily white, black, gray, and blue.

## Canvas

`#FFFFFF`

Primary background.

## Soft Canvas

`#FAFBFC`

Use selectively for section changes.

Do not alternate every section white / gray automatically.

## Primary Ink

`#171717`

Main headlines.

## Deep Ink

`#0D0E10`

Optional for high-emphasis black surfaces.

## Body

`#646970`

Body copy.

## Muted

`#92979E`

Secondary labels.

## Faint

`#B8BDC4`

Very low-priority technical labels.

## Hairline

`#ECEEF1`

Standard borders.

## Strong Hairline

`#D9DDE3`

Inputs, cards, stronger structure.

---

# 6. BRAND BLUE

## Scout Blue

`#2F80FF`

This becomes Scout's directional accent.

Use on the marketing site for:

- north-point logo element
- primary marketing CTA
- links
- navigation points
- active route nodes
- subtle path lines
- active scroll markers
- small visual highlights

## Deep Scout Blue

`#1F68DC`

Hover / active CTA state.

## Sky Blue

`#CFE7FF`

Soft atmospheric light.

## Pale Sky

`#EEF6FF`

Very subtle section tint.

## Compass Line Blue

`rgba(47, 128, 255, 0.18)`

Use for:

- compass rings
- plotted paths
- directional guides
- technical linework

---

# 7. COLOR STRATEGY

The current page should remain mostly white.

Approximate visual balance:

80% white / near-white

15% black / gray

5% blue

The blue should appear as a **signal**, not as wallpaper.

Avoid:

- blue cards everywhere
- blue section backgrounds everywhere
- all-blue dashboard chrome
- giant gradient blobs
- neon blue

The visual should feel like the page contains a small amount of valuable blue information.

---

# 8. MARKETING CTA COLOR

The current website can retain its existing CTA wording.

Visually:

## Primary marketing CTA

Scout Blue background.

White text.

8px radius.

Height:
40–44px.

Example existing CTA wording remains unchanged.

## Secondary CTA

White / transparent.

Dark text or Scout Blue text.

Optional hairline.

## Product application actions

Inside Scout's actual authenticated product, continue favoring black / near-black primary operational actions where already defined.

This creates a useful distinction:

Marketing:
blue = invitation / direction

Product:
black = operational action

Do not change CTA wording to achieve this.

Only change visual styling.

---

# 9. TYPOGRAPHY

Use the existing typography family unless the repository already contains a different approved implementation.

Preferred:

# Inter

Use for:

- hero headline
- section titles
- body
- nav
- buttons
- UI
- product screenshots / surfaces

Weights:

400 — body

500 — buttons / navigation

600 — headings

Avoid relying on 700–900 weights.

Scout should feel precise rather than loud.

---

# 10. TECHNICAL TYPE

Use:

# JetBrains Mono

for limited field-intelligence details.

Good examples:

`FIELD INTELLIGENCE FOR SALES TEAMS`

`01 — BRING YOUR LIST`

`KNOWN`

`INFERRED`

`SUGGESTED`

`83 / 197 WORKED`

`SOURCE`

`CHECKED TODAY`

`READY`

The mono font helps create the "field intelligence" character.

Do not use mono for normal sales copy.

---

# 11. TYPE SCALE

Do not change existing words.

Adjust typography around them.

## Hero

Desktop:
`clamp(44px, 5vw, 64px)`

Weight:
600

Line-height:
1.03–1.08

Tracking:
approximately `-0.03em`

The current hero headline should feel confident and editorial, not oversized.

## Section title

32–40px

Weight:
600

## Feature title

20–24px

## Body

16–18px depending on context.

## Mono eyebrow

11px

Uppercase.

Tracking:
0.08–0.12em

---

# 12. PAGE WIDTH

Maximum marketing content width:

`1200px`

Some product compositions may reach:

`1280px`

Do not stretch normal text sections beyond this.

Long body copy should stay:

`560–680px`

depending on layout.

---

# 13. SECTION RHYTHM

Desktop default:

`96px`

vertical section spacing.

Large visual storytelling sections:

`112–128px`

Small strips:

`56–72px`

Mobile:

`56–72px`

The page currently has large white spaces.

Do not solve this by randomly reducing all spacing.

Instead add **visual anchors** inside the white space.

---

# 14. SHAPE LANGUAGE

Buttons:
8px radius

Inputs:
8px

Cards:
10–12px

Large product container:
14–16px

Badges:
pill allowed

Do not make Scout soft and bubbly.

Avoid:

20px+

radii across normal UI.

---

# 15. SHADOW LANGUAGE

Most visual separation should come from:

- white space
- hairlines
- background contrast
- depth hierarchy

Shadows remain subtle.

## Small card

`0 8px 28px rgba(17,24,39,0.06)`

## Floating product

`0 24px 70px rgba(17,24,39,0.10)`

## Scroll-flight foreground object

Up to:

`0 34px 80px -36px rgba(23,23,23,0.32)`

if already working well.

Avoid heavy black shadows.

---

# 16. THE NORTH-STAR DESIGN SYSTEM

This is the biggest visual upgrade from the current barebones page.

Create a reusable system of Scout-specific background and structural motifs.

Use only 1–2 motifs per major section.

---

# 17. COMPASS RINGS

Thin concentric circles.

Stroke:

1px.

Opacity:

8–15%.

Color:

Scout Blue or cool gray.

Use primarily:

- hero
- scroll-flight stage
- final CTA

Possible form:

one center point

three to five thin rings

four directional ticks

one emphasized blue north point

Do not use a giant literal compass illustration everywhere.

---

# 18. NORTH-STAR MARKER

Create a simple geometric four- or eight-point star / directional point.

This can appear:

- behind hero product UI
- as a subtle section anchor
- in final CTA
- as a small visual endpoint of a route line

Keep it geometric.

No sparkle emoji aesthetic.

---

# 19. ROUTE LINE

Create a thin Scout route / plotted path system.

Visual:

- faint 1px line
- occasional 4–6px blue nodes
- subtle turns / angular changes
- optional dotted segments

This can visually connect:

List

→ Research

→ Brief

→ Call

→ Memory

→ Outcome

The line should reinforce the actual workflow.

Do not place route lines randomly just because they look nice.

---

# 20. FIELD COORDINATES

Small mono coordinates / orientation markers can appear at edges of large sections.

Examples:

`N 00°`

`E 90°`

`FIELD 01`

`SOURCE 03`

`ACCOUNT / ACTIVE`

Use sparingly.

This is a subtle way to make Scout feel like "field intelligence" instead of a generic sales app.

Do not turn it into a sci-fi HUD.

---

# 21. BACKGROUND GRID

A very faint technical grid may appear in:

- hero
- one product showcase
- analytics / data section

Opacity:

2–4%.

Use large spacing.

Avoid obvious graph paper.

The grid should almost disappear.

---

# 22. TOPOGRAPHIC LINES

Very faint topographic / contour line patterns can appear:

- near final CTA
- lower footer transition
- one account-memory visual

Opacity:
3–6%.

Do not use in every section.

This subtly ties Scout to "terrain / field" without becoming outdoors-themed.

---

# 23. HERO — PRESERVE CURRENT COPY

The hero copy is locked.

Do not change:

- eyebrow wording
- headline wording
- body wording
- CTA wording

Only improve design.

## Current hero design goal

The hero should become more distinctive through:

- approved Scout logo in navigation
- north-star radial geometry
- soft sky-blue atmosphere
- more polished product depth
- route / node details
- stronger framing of the current scroll-flight teaser

---

# 24. HERO COMPOSITION

Keep the current clean centered hero structure unless a layout adjustment improves readability.

Recommended:

Top:
nav

Below:
existing eyebrow

Then:
existing hero headline

Then:
existing body

Then:
existing CTAs

Below:
scroll hint

Then:
first product surface enters from lower viewport.

Behind all of this:

one large low-opacity compass / north-star field.

The hero should not contain extra copy.

---

# 25. HERO ATMOSPHERE

Background:

white.

Add:

a soft sky-blue radial glow around the top / center product field.

Example:

`radial-gradient(ellipse 70% 55% at 50% 5%, rgba(207,231,255,0.72), transparent 68%)`

Keep it subtle.

The page edges remain white.

---

# 26. HERO NORTH STAR

Place a large, low-opacity compass / north-point form behind the product flight stage.

Potential design:

- one blue directional arrow
- thin concentric rings
- small north marker
- faint route points

Opacity:
5–15%.

It should be perceived rather than immediately noticed.

---

# 27. HERO DEPTH

The current scroll-flight already uses live UI surfaces and CSS 3D transforms.

Keep this strength.

Do not replace readable real Scout surfaces with AI-generated fake dashboard video simply for visual novelty.

The page should look premium because the real product is moving through space.

Use:

- slight scale differences
- subtle perspective
- small lateral offsets
- soft shadows
- front / mid / background separation

Avoid:

- exaggerated rotations
- dramatic 3D
- flying cards everywhere

---

# 28. `/scroll-world` SKILL — SOURCE OF TRUTH FOR SCROLL MECHANICS

A `/scroll-world` skill is available.

Read the skill before changing the scroll-flight implementation.

The skill's core principle is that **scroll drives time / camera movement through a connected journey**, and continuity is the most important visual quality requirement.

Scout already has a live-DOM adaptation of that idea.

Do NOT automatically delete or replace the current implementation.

The current implementation is the baseline.

---

# 29. CURRENT FLIGHT IMPLEMENTATION IS CANONICAL FOR CONTENT

The current `FlightHero` contains seven beats.

Preserve:

- the seven-beat progression
- every scene's existing copy
- the demo data currently displayed
- existing CTA wording
- current section order

Do not add or remove beats simply for design.

Current beats conceptually include:

0. Hero / spreadsheet
1. Target list / workspace
2. Research sources
3. Call-ready brief
4. Post-call
5. Memory
6. Closing / Scout

The exact wording in the code remains untouched.

---

# 30. SCROLL-WORLD VISUAL INTEGRATION

Enhance the existing flight using Scout's North Star system.

As the user moves through scenes:

- faint path lines may move / resolve
- the active route node may change blue
- compass field may subtly shift
- background atmosphere may change slightly
- scene depth may become more dimensional
- section rail may become more branded

The user should feel:

> I am moving through one Scout workflow.

Not:

> I am watching seven unrelated cards fly past me.

---

# 31. SCROLL ARCHITECTURE

For Scout, use the `/scroll-world` skill's **continuous-forward** mindset.

This is appropriate because Scout is:

- grounded
- product-focused
- premium
- process-driven

Avoid a diorama-style:

zoom out

fly to another island

zoom back in

pattern.

Even if the implementation remains CSS / DOM rather than rendered video, preserve the same continuity principle:

the viewer should feel forward progress.

---

# 32. CAMERA FEEL

Use:

slow controlled forward movement

small lateral movement

gentle depth shift

subtle half-orbit where it improves the product view

steady continuation toward the next scene

End each scene with calm motion.

Begin the next scene continuing the same visual momentum.

Avoid:

camera reversal at transitions

large zoom-outs

spinning product panels

fast fly-bys

snap cuts

---

# 33. CURRENT CSS-3D FLIGHT VS TRUE PRE-RENDERED `/scroll-world`

## Preferred V1

Keep the existing live DOM / CSS 3D flight if:

- text remains crisp
- product UI remains real
- performance is good
- scene transitions are smooth

This is particularly valuable for a SaaS product because AI-generated video can distort interface text.

## Optional cinematic upgrade

If Claude Design chooses to use the full pre-rendered `/scroll-world` engine:

- preserve all current wording as DOM overlay copy
- preserve the same seven beats
- use Architecture A / continuous forward movement
- follow the skill's seam-continuity rules exactly
- use real rendered Scout product surfaces as source material wherever possible
- do not regenerate UI text through an image/video model if it makes it unreadable
- preserve a static / live DOM fallback

Do not use paid generation without a clear implementation need.

---

# 34. SCROLL-WORLD PACING

The skill supports different dwell lengths.

Scout should not give every beat equal visual time.

More dwell:

- call-ready brief
- post-call workflow

Medium dwell:

- target list
- memory

Shorter transit:

- source aggregation
- closing transition

The current wording remains unchanged.

Only timing changes.

---

# 35. SCROLL RAIL

The current left rail is useful.

Upgrade its design.

Instead of generic dots only, make it feel like a field-navigation rail.

Possible design:

thin vertical rule

small nodes

active node:
Scout Blue

inactive:
hairline gray

small mono labels

Optional top / bottom marker:
`N`
`S`

Do not make it large.

Do not make it colorful.

The rail should feel like a navigational instrument.

---

# 36. SCROLL HINT

Keep existing wording.

Visually enhance through:

- tiny down marker
- subtle vertical route line
- blue dot
- very gentle opacity pulse

Do not add more copy.

No bouncing arrow.

---

# 37. VALUE STRIP

Current wording remains unchanged.

Upgrade visual treatment.

Use:

- 3-column editorial layout
- thin vertical hairlines
- small mono numbers
- optional faint route line passing behind / between columns
- tiny north-star marker at one edge

Do not put every value into a floating card.

This section should feel architectural.

---

# 38. HOW SCOUT WORKS

Current copy and six steps are locked.

Current two-column format is strong.

Upgrade with:

- a vertical / stepped Scout route line
- blue active-style nodes for each numbered step
- light technical connector geometry
- stronger whitespace hierarchy
- small compass marker at beginning / end

The actual six step labels and descriptions stay untouched.

Avoid icon clutter.

---

# 39. CERTAINTY SECTION

Current wording remains unchanged.

The existing:

KNOWN

INFERRED

SUGGESTED

system is visually strong and differentiating.

Improve the section through:

- slightly more premium card spacing
- stronger top label treatment
- quiet background compass geometry
- subtle directional order left → right
- optional connecting rule showing certainty decreasing across the row

Keep badges neutral.

Do not make:
KNOWN = green
INFERRED = yellow
SUGGESTED = red

That makes the system feel simplistic.

---

# 40. CERTAINTY BACKGROUND

Add one subtle visual device:

a large thin compass circle cropped at the right or bottom of the section.

Or:

a faint field grid.

Not both.

Keep opacity extremely low.

This prevents the section from feeling like three cards floating on empty white.

---

# 41. DARK SECTION

The current dark section wording is locked.

Do not replace it with another manifesto.

The current approved copy remains.

Visually:

Background:
`#171717`

Text:
white

Mono eyebrow:
muted cool gray

Add:

- faint blue route line
- subtle blue north-point marker
- very light radial highlight behind the statement

Do not add a giant glowing compass.

The contrast itself creates drama.

---

# 42. DARK SECTION SCALE

This section should not feel like an enormous brand manifesto.

Keep it relatively compact.

Recommended:

96–120px vertical padding.

Content max width:
760px.

This should feel like a punctuation mark between sections.

---

# 43. WORKS WITH YOUR STACK

Current wording remains locked.

Instead of leaving the section as mostly text on white, add a restrained visual system diagram.

Do NOT create new integration copy.

Possible visual:

left:
small source blocks

CRM
Spreadsheet
Existing tools
Public data

center:
Scout compass mark

right:
one call-ready brief / account surface

But only use actual supported / generic categories already present in the product context.

Do not invent integration logos.

Use abstract line labels rather than fake partner logos.

---

# 44. STACK DIAGRAM STYLE

Hairline boxes.

No giant cards.

Simple connection lines.

Scout Blue only at the Scout node / route.

Everything else neutral.

This communicates:

Scout organizes the workflow around existing systems.

Do not add messaging text beyond what already exists.

---

# 45. FINAL CTA

Current headline and CTA wording remain unchanged.

This is where the sky / North Star atmosphere can return.

Visual treatment:

soft sky-blue lower-page gradient

very faint contour / topographic lines

small central north-star symbol

one thin plotted route arriving at the CTA

This makes the site feel like it completes a journey.

---

# 46. FINAL CTA BACKGROUND

Suggested:

white top

soft pale-blue center / lower edge

very light topographic line system

Avoid:

giant blue rectangle

gradient button explosion

glowing CTA

The CTA should still feel clean.

---

# 47. FOOTER

Preserve current footer text / links.

Visually improve with:

- Scout logo lockup
- hairline top
- balanced columns
- smaller mono legal / product-state details if already present
- generous but not excessive spacing

Do not create extra footer categories unless they already exist.

---

# 48. SECTION TRANSITIONS

The page currently feels bare partly because sections end abruptly into white space.

Use subtle visual transitions.

Possible tools:

- hairline rule with tiny blue node
- route line crossing boundary
- cropped compass ring
- pale-sky wash fading in / out
- a one-pixel coordinate rail along edge

One transition device per boundary maximum.

---

# 49. EDGE DETAILS

Use the extreme left / right page edges for subtle Scout identity.

Examples:

very faint vertical field rule

small coordinate ticks

one blue node

tiny labels like:

`N 00°`

`S 180°`

Use only on desktop and wide tablet.

Hide on smaller screens.

Do not compete with content.

---

# 50. PRODUCT MOCKUP FRAMES

Product surfaces should feel like real application windows.

Use:

12–16px radius.

Hairline border.

Very soft shadow.

Optional browser-like top bar only when useful.

Do not add fake Mac traffic-light dots to every surface.

Do not make every screenshot look like a floating browser window.

Use different compositions while preserving one visual language.

---

# 51. REAL PRODUCT FIRST

If the repository already has actual product UI:

use it.

Do not redraw the product purely for the marketing site.

If a simplified marketing presentation is necessary:

preserve:

- real structure
- real labels
- real terminology
- real data relationships

No fake new features.

---

# 52. SOURCE / EVIDENCE VISUALS

Scout's evidence model is differentiating.

Design sources elegantly.

Suggested visual system:

small mono label:
`SOURCE`

source title

short detail

subtle external arrow

Or:

inline references:
`[01]`
`[02]`

with an evidence drawer.

Marketing visuals may show source relationships through thin blue path lines.

Do not make sources look academic or legalistic.

---

# 53. PRODUCT STATUS DESIGN

Statuses such as:

READY

LIMITED DATA

KNOWN

INFERRED

SUGGESTED

should use subtle neutral treatments.

Blue:
active / informational.

Green:
only actual success / completion when useful.

Avoid excessive status colors.

---

# 54. FEATURE ICON STYLE

Use a small custom Scout icon family.

Visual rules:

1.5px strokes

geometric

minimal

black / gray with Scout Blue detail

Possible motifs:

compass

direction point

source nodes

target / focus

memory stack

account / person

route

Do not use generic sparkle icons.

---

# 55. 3D DESIGN RULE

A little depth is encouraged.

The current website should gain sophistication from:

- perspective
- layered product panels
- subtle shadows
- controlled z-depth
- route geometry

Do not add unrelated 3D illustrations.

The product itself is the 3D object.

---

# 56. 3D HERO LAYERING

Possible hierarchy:

BACK:
faint compass rings / north-star geometry

MID:
Target List / spreadsheet surface

FRONT:
selected Call-Ready Brief

SIDE:
source panel / post-call surface

All pieces must represent existing Scout content.

Do not add fake screens.

---

# 57. MOTION PRINCIPLES

Motion should feel:

precise

quick

controlled

premium

Standard transitions:

150–250ms.

Longer atmospheric motion:

500–900ms.

Scroll-flight:
driven by scroll position.

Avoid autoplay spectacle.

No bouncing.

No springy startup-style motion unless extremely subtle.

---

# 58. SCROLL-WORLD ACCESSIBILITY

The `/scroll-world` skill explicitly supports reduced-motion behavior.

Scout must preserve:

`prefers-reduced-motion`

fallback.

For reduced motion:

- disable continuous flight
- show the most useful product surface statically
- preserve all copy
- preserve CTA access

The page must remain understandable without motion.

---

# 59. MOBILE STRATEGY

The current website already falls back away from the full flight under smaller viewports.

Keep that principle.

Do not cram the 3D flight into mobile.

Mobile should show:

- same existing wording
- one strong Scout product surface
- stacked story sections
- lighter compass motifs
- no edge coordinate rails
- simpler final CTA atmosphere

If a true native mobile `/scroll-world` chain is ever created, follow the skill's explicit 9:16 requirements.

Do not silently center-crop desktop media and call it a mobile experience.

---

# 60. PERFORMANCE

The page should feel swift.

Do not make visual identity dependent on:

- giant WebGL bundles
- autoplay background video
- uncompressed assets
- unnecessary shaders
- massive parallax libraries

Current CSS 3D is preferable when it achieves the desired result.

If using full `/scroll-world` media:

follow the skill's loading / poster / scrub performance guidance.

The text and CTA should render immediately.

---

# 61. NO COPY EMBEDDED IN GENERATED MEDIA

If image/video generation is used for any visual layer:

do not generate Scout's marketing copy into the image/video.

Generated media often distorts text.

Existing wording should remain live HTML / DOM.

Product UI should remain real DOM or carefully rendered real UI where possible.

This protects:

- accuracy
- accessibility
- readability
- copy lock

---

# 62. DO NOT ADD FAKE SOCIAL PROOF

Visual design must not introduce:

- fake company logos
- fake reviews
- fake headshots
- fake testimonials
- fake user counts
- fake customer numbers
- fake ROI metrics

If the current website does not have it:

design should not invent it.

---

# 63. DO NOT CHANGE PRODUCT CLAIMS

Claude Design must not add claims like:

- 3.2x meetings
- 28% win rate
- 21% pipeline lift
- save 10 hours
- increase conversion 40%

unless those exact validated metrics already exist in the current product / approved marketing copy.

The design inspiration image is visual inspiration only.

Its copy and metrics are NOT approved content.

---

# 64. INSPIRATION IMAGE USAGE

The supplied Scout website inspiration image is a **visual reference only**.

Use it for inspiration around:

- north-star motif
- compass geometry
- blue / white balance
- layout confidence
- product-forward hero
- section framing
- subtle background linework
- stronger visual rhythm
- final CTA atmosphere

Do NOT copy:

- its headline
- its product labels
- its feature copy
- its statistics
- its testimonials
- its nav wording
- its CTA wording
- its fake customer names / logos
- any product capabilities not already in Scout

The existing Scout website text remains authoritative.

---

# 65. PAGE-SPECIFIC DESIGN DIRECTION

## Navigation

Upgrade from plain text wordmark to approved logo lockup.

Keep existing nav wording.

Add slightly stronger spacing and refinement.

Optional active / hover treatment:

thin blue underline

or tiny blue directional point.

No floating nav pill.

---

# 66. HERO DESIGN DIRECTION

Keep existing hero wording.

Add:

- large faint compass field
- subtle blue north marker
- improved logo
- slightly stronger product lift
- more intentional relation between hero text and first flight surface
- thin coordinate / route details at edges

The page should immediately feel branded even before scrolling.

---

# 67. FLIGHT SCENE 0

Keep content.

Design intention:

the spreadsheet is the raw starting point.

Visual:
small / lower in hierarchy.

It should look like the beginning of a journey.

Subtle route line should originate here.

---

# 68. FLIGHT SCENE 1

Keep content.

Design intention:

the list becomes organized.

Allow the Target List to feel more substantial.

Add:

- small active blue route node
- stronger selected-row treatment
- tiny Scout compass mark if appropriate

Do not rewrite labels.

---

# 69. FLIGHT SCENE 2

Keep content.

Design intention:

multiple sources converge.

The current floating source cards are a good foundation.

Add:

- thin connector lines
- blue source nodes
- one central convergence point

This is one of the best opportunities for the North Star / navigation visual language.

Avoid making it look like an AI neural network.

---

# 70. FLIGHT SCENE 3

Keep content.

Design intention:

this is the payoff.

The Call-Ready Brief should be the clearest, largest, most visually stable scene.

Give it:

- strongest readability
- slightly larger scale
- longest dwell
- subtle blue north marker
- cleaner shadow
- more stable camera

This should visually say:

Scout organized the chaos.

---

# 71. FLIGHT SCENE 4

Keep content.

Design intention:

turn rough activity into clean output.

Use a restrained transformation visual.

For example:

rough note panel

↓

subtle directional line

↓

clean output panel

Avoid sparkles / magic effects.

---

# 72. FLIGHT SCENE 5

Keep content.

Design intention:

memory accumulates.

Current account tiles can be upgraded into a subtle knowledge-field composition.

Possible:

account tiles aligned on a grid

faint connection lines

small note / rep counts

Do not add new copy.

---

# 73. FLIGHT SCENE 6

Keep current final scene wording / CTA structure.

Do not use the old "We do not sell AI" positioning.

Use whatever wording currently exists in the site.

Visually:

dark or high-contrast final flight object is allowed if currently used.

The last scene should transition naturally into the page's final / lower visual system.

---

# 74. VALUE STRIP DESIGN

Keep all current wording.

Improve:

number styling

divider alignment

spacing

one subtle blue route rule

Maybe use a small compass marker beside `01`.

Do not use three separate chunky cards.

---

# 75. HOW IT WORKS DESIGN

Keep all copy.

Use the existing left editorial intro + right six-step list.

Add a visual route:

vertical line through step numbers

active blue point at each step

very faint directional arrow between steps

This is visually consistent with the Scout metaphor and does not require new copy.

---

# 76. CERTAINTY DESIGN

Keep all wording.

Use a stronger editorial frame.

Potential layout:

wide section

large heading

three equal certainty cards

a faint directional gradient / line from stronger to weaker certainty

Do not label one state as "good" or "bad" with loud colors.

---

# 77. DARK BAND DESIGN

Keep current wording.

Design:

full-width dark section.

Could include:

small north marker

one faint plotted route

tiny mono grid coordinate

No product card needed unless already present.

This section should provide visual rest / contrast.

---

# 78. STACK DESIGN

Keep current text.

Add a visual system under or beside the copy.

Use abstract generic source categories rather than fake brand logos.

Show:

several neutral data source blocks

↓

Scout

↓

one clean call-ready output surface

This is a design diagram, not new copy.

Labels should come from existing supported concepts.

If exact labels are not already approved in the site, use no added labels.

---

# 79. FINAL CTA DESIGN

Keep current wording / CTAs.

Use:

sky gradient

faint contour lines

north-star endpoint

small route line entering the section

This should feel like the destination of the visual journey.

---

# 80. FOOTER DESIGN

Keep content.

Use:

approved logo

clean hairline

small typography

balanced whitespace

Optional subtle field coordinate at far edge.

No giant footer.

---

# 81. VISUAL DENSITY

The page needs "a little more design," not a maximal redesign.

Target:

20–30% more visual detail than the current implementation.

Not:

100% more.

Every section does not need a unique illustration.

The site should still feel fast and calm.

---

# 82. DESIGN DIFFERENTIATION

The site should become recognizable through repeated restrained cues:

1. Scout compass logo
2. Scout Blue north point
3. mono field labels
4. thin route / plotted line
5. low-opacity compass circles
6. product UI as primary visual
7. precise hairline structure

Those seven things should create the brand.

Do not introduce ten additional themes.

---

# 83. ANTI-GENERIC RULE

If a section could be dropped unchanged into:

- an AI email tool
- an AI meeting assistant
- an HR SaaS
- a fintech dashboard
- a project management tool

then the design is probably too generic.

Ask:

How can the Scout visual system subtly communicate:

direction

research

account preparation

field intelligence

without changing the copy?

---

# 84. ANTI-AI-SLOP RULE

Do not add:

purple gradient

rainbow gradient

glowing orb

sparkle icon

magic wand

brain icon

floating chatbot bubble

neural network

particle starfield

animated typing AI answer

generic "Ask AI" surface

unless it is an existing real feature.

Scout should look sophisticated without visually shouting "AI."

---

# 85. BUTTON FEEL

Buttons should feel compact and responsive.

Marketing primary:

height:
40–44px

radius:
8px

medium weight

Scout Blue

Hover:
slightly darker

Pressed:
1px visual compression / translate

No glow.

No giant pill.

No glossy gradient.

---

# 86. LINKS

Scout Blue.

Text underline on hover or small arrow shift.

Do not create button containers for every link.

---

# 87. HOVER STATES

Subtle.

Cards:
border strengthens slightly

Account row:
soft gray background

Source:
blue text / arrow

Nav:
small blue marker or text darkening

No dramatic scale changes.

---

# 88. PRODUCT TABLES

Keep compact.

Use:

hairline rows

neutral background

selected row:
soft pale blue / gray

status dot:
small

Do not over-card tables.

---

# 89. BADGES

Small.

Mono.

Uppercase where already used.

Neutral.

Radius:
pill.

Do not make badges huge.

---

# 90. VISUAL STORY HIERARCHY

The page should visually emphasize:

1. Hero
2. Scroll-flight / product workflow
3. Call-ready brief
4. Product principles
5. Final CTA

Not every section deserves the same visual weight.

---

# 91. SECTION BACKGROUND PLAN

Recommended:

Hero:
white + sky atmosphere + compass geometry

Value strip:
white

How Scout Works:
soft canvas

Certainty:
white + one subtle motif

Dark band:
near-black

Stack:
white

Final CTA:
white → pale sky atmosphere

Footer:
white

This gives rhythm without random visual switching.

---

# 92. EDGE COORDINATE SYSTEM

Optional desktop-only element.

At far left / right:

very faint vertical line.

Tiny compass orientation labels.

Example:

top-left:
`N / 00°`

top-right:
`E / 90°`

These should be almost decorative whitespace structure.

Do not add if they make the page feel technical or gimmicky.

---

# 93. VISUAL ROUTE

A single subtle route can conceptually begin in the hero and reappear periodically down the page.

It does NOT need to remain physically continuous through every section.

Use it like a recurring visual motif.

Examples:

Hero:
origin node

Scroll:
active scene rail

How It Works:
vertical route

Final CTA:
arrival node

This creates cohesion.

---

# 94. IMAGE / VIDEO GENERATION

Do not generate decorative imagery just because a tool is available.

If generated media is used:

it must support the Scout visual system.

Good:
subtle atmospheric motion
north-star lighting
background depth

Bad:
fake product interfaces
fake dashboards
random futuristic scenes

For product surfaces:
real DOM / real screenshots are preferred.

---

# 95. `/scroll-world` TRUE VIDEO MODE

If the full skill is used for pre-rendered video:

use the skill itself as the implementation source of truth.

Important design choice:

Scout should use the continuous-forward architecture.

The skill states that continuity at seams is critical and that the camera should continue forward for grounded experiences.

Do not improvise a different seam method.

Do not mix video models mid-chain unless the skill explicitly allows the fallback.

Do not create visible cuts.

Do not alter copy as part of the render process.

---

# 96. SCROLL-WORLD TEXT

Existing text remains DOM overlay.

Do not bake scene headline / body copy into generated video.

This ensures:

- exact copy preservation
- accessibility
- responsive layout
- legibility
- easy future wording changes by the founder

---

# 97. SCROLL-WORLD SCENE STYLE

If media is generated, all scenes share one identical style preamble.

For Scout:

Clean premium software environment.

White canvas.

Black / dark gray product UI.

Scout Blue directional accents.

Soft cool daylight.

Controlled depth.

No people required unless the real product story specifically requires them.

No text in generated environment.

No fantasy setting.

No miniature town.

No outdoors scenery.

---

# 98. SCROLL-WORLD CAMERA STYLE

Preferred:

one continuous product walkthrough.

Motion ideas:

- slow push toward active account
- subtle lateral glide through source cards
- half-orbit around call-ready brief
- continue past it toward post-call
- gentle move into accumulated memory
- settle toward final CTA

Each segment should end in forward drift.

No abrupt reversals.

---

# 99. MOBILE SCROLL-WORLD

Current fallback behavior is acceptable.

Do not force a native mobile cinematic unless explicitly approved.

If a dedicated mobile chain is later built:

follow `/scroll-world` skill guidance:

native 9:16

not a center crop

separate budget

separate QA

Current mobile wording remains identical.

---

# 100. REDUCED MOTION

Reduced-motion users should see:

- hero copy
- one polished static call-ready product surface
- all normal page sections
- no scroll-flight movement

Do not hide content because motion is disabled.

---

# 101. DESIGN QA — COPY

Before finishing:

diff the marketing copy before and after.

There should be no unintended copy changes.

Review especially:

`src/app/page.tsx`

`src/components/marketing/flight-hero.tsx`

If wording changed unintentionally:

restore it.

This is mandatory.

---

# 102. DESIGN QA — VISUAL

Ask:

Does the page still feel clean?

Does it now feel more branded?

Does the Scout / North Star identity appear without becoming cheesy?

Does the product remain the hero?

Does the site feel like Scout instead of a generic startup?

Is any visual element unnecessary?

Does the scroll flight still feel smooth?

Does the page feel more premium without becoming busy?

---

# 103. DESIGN QA — REALITY

Do not let inspiration imagery override the real Scout product.

The design must gracefully support:

- real data
- long company names
- missing people
- low-data accounts
- research states
- different source counts
- post-call notes
- certainty labels

The website must not depend on perfect fake data to look good.

---

# 104. DESIGN QA — PERFORMANCE

Check:

initial page load

scroll smoothness

3D transform performance

reduced motion

mobile fallback

layout shift

font loading

large assets

If a design effect hurts the experience:

remove or simplify it.

---

# 105. IMPLEMENTATION ORDER

When Claude Design applies this file:

## STEP 1

Read current website source.

Do not alter copy.

## STEP 2

Read `/scroll-world` skill.

Understand current FlightHero adaptation before changing it.

## STEP 3

Implement approved Scout logo treatment.

## STEP 4

Implement design tokens.

## STEP 5

Upgrade hero background / North Star geometry.

## STEP 6

Upgrade current scroll-flight styling and route system.

## STEP 7

Upgrade value strip.

## STEP 8

Upgrade How Scout Works.

## STEP 9

Upgrade certainty section.

## STEP 10

Upgrade dark section.

## STEP 11

Add restrained visual system to stack section.

## STEP 12

Upgrade final CTA / footer.

## STEP 13

Responsive / reduced-motion QA.

## STEP 14

Run copy diff.

No copy changes.

---

# 106. FINAL DESIGN TEST

The final site should make someone think:

> "This is clean."

> "This feels different."

> "This looks expensive."

> "This looks like a real software company."

> "The compass / North Star idea fits Scout."

> "The design isn't trying too hard."

> "I understand the product."

The user should NOT think:

> "This looks like every AI startup."

or:

> "Why are there random stars everywhere?"

or:

> "The animation is cooler than the product."

The rule is:

# CLARITY FIRST.
# BRAND SECOND.
# DECORATION LAST.

When both clarity and beauty are possible:

make it beautiful.

---

# 107. FINAL CLAUDE DESIGN COMMAND

Use this file to visually refine the existing Scout marketing site.

**Do not rewrite the website.**

Do not change its pitches.

Do not change its existing copy.

Do not replace its current product narrative.

Do not invent new claims.

Keep the current `/scroll-world`-inspired flight and improve its visual integration unless a technically superior implementation preserves the exact same content and behavior.

Use the Scout compass / North Star identity to make the page feel more designed, more premium, and more ownable.

The goal is not a new website.

The goal is:

# THE SAME SCOUT WEBSITE,
# DESIGNED LIKE A GREAT COMPANY BUILT IT.
