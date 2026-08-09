# Council Review — Phase 4 (UI/UX, Website, Integration)

Reviewing the actual built product: the component primitive library,
the polished Home/My Lists/Target List/Call-Ready Brief/Analytics
pages, the founder admin research diagnostics, the marketing site with
its CSS-3D hero composite, and the stress-test fixtures substituting
for missing Phase 3.5 data — against the standard: *"Does this look
expensive? Does it feel intentional? Would a disciplined,
well-funded, multi-million-dollar SaaS company ship this?"*

---

## FOUNDER — "Does Scout now look like a company I would proudly sell?"

**Closer than any prior phase, with one real caveat.** The marketing
site's positioning ("We do not sell AI. We sell better-prepared
salespeople.") and the product's actual visual restraint (no purple
gradients, no glowing orbs, no fake AI-score precision anywhere) are
consistent from the homepage through the deepest Account Brain
disclosure — that consistency is itself the thing that would make a
founder comfortable showing this to a real prospect. The caveat:
everything demoable is still demo-mode. A founder proudly selling this
has to be explicit, every time, that the research quality shown is
hand-written, not live — `PHASE_3_5_STATUS.md` says this plainly in
the repo, but the product itself doesn't say it out loud anywhere in
the UI. Worth a small, honest "Demo Mode" indicator somewhere visible,
not just a doc.

## CRO — "Could I actually prospect from this for several hours?"

**The core loop holds up under stress-testing now, which it hadn't
been checked against before this phase.** Filtering/searching the All
Accounts list, the reordered Call-Ready Brief hierarchy (what matters
before recent news, per product spec §14), and the Sources drawer all
reduce real friction versus Phase 2/3's static lists. The stress-test
fixtures (10 sources, 6 stakeholders, a null title, a fully empty
account) rendering cleanly is a genuine, verified signal — not just
claimed, actually curled and checked against a running dev server this
session. Unresolved: real call volume, real research latency, and
whether a rep would actually use the outcome-logging UI daily are
still unproven — no live backend exists to generate that behavior.

## CFO — "Does the product visually and functionally justify meaningful SaaS pricing?"

**Visually, yes — the restraint itself reads as expensive**, which is
the harder thing to fake than a flashy demo. Functionally, the
Analytics page (event-sourced, real denominators, no fabricated
funnel) is the strongest evidence a paying customer would actually get
what they're told they're getting. What's still missing for a pricing
conversation: real cost data (`RESEARCH_COSTS.md` remains unmeasured),
and a customer admin/billing surface that doesn't exist yet
(`CUSTOMER_ADMIN.md`) — a CFO evaluating this for purchase would ask
"how do I manage my subscription" and get no answer today.

## CTO — "Is the interface honestly connected to the underlying system and safe workflows?"

**Yes, and this is the area with the most concrete progress this
phase.** Every UI change this phase reused real domain functions
(`summarizeResearchProgress`, `computeActivityCounts`,
`describeFreshness`, `resolveConflict`'s downstream effects) — nothing
was hand-typed illustrative data in the rep-facing product surfaces.
The one deliberate exception (the founder admin's Customer/
Implementation/Billing sections) is explicitly labeled illustrative in
both the page's own comment and this report, not silently presented as
real. The admin route's authorization gap (no `platform_admin` check
wired up) remains the single most important honesty flag in the whole
system — the code comment and `SECURITY.md` cross-reference are
correct to keep repeating it until it's actually fixed.

## CUSTOMER (VP of Sales) — "Would I trust my team to use this?"

**The visual trust signals are real and load-bearing, not decorative**
— certainty badges, freshness chips, the identity-match warning driven
directly by a real schema field rather than a hardcoded special case
(this phase's `getIdentityWarning` refactor). A skeptical VP clicking
around `/demo` would find a product that admits uncertainty rather
than hiding it, which is exactly the trust-building the product spec
asks for. Still unanswerable: whether real reps at a real customer
would actually adopt this daily — no pilot has run.

---

## Cross-cutting findings

**Strongest screen:** The Call-Ready Brief / Account Brain page. It's
the one place where information hierarchy, certainty labeling,
freshness, and the conflicting-evidence handling (Vantage Point
Builders' CFO example) all come together into something that actually
demonstrates the product's core differentiator, not just its visual
polish.

**Weakest screen:** The Founder Operations Console. It's honest about
being a stub, which is correct — but as a screen on its own, it's the
least "expensive-looking" surface in the product (plain key-value
rows, no real hierarchy). Acceptable given it's explicitly internal-
only and not customer-facing, but it's the first place a design pass
should return to once real auth exists.

**Most confusing workflow (candidate):** The path from "account has a
call outcome" to "post-call workflow" requires navigating to a
separate route (`/demo/accounts/[id]/post-call`) rather than being
inline — a rep mid-call-block might not immediately find it. Worth
testing with a real rep before assuming this is fine.

**Unnecessary visual feature:** None identified as clearly unnecessary
— the council specifically checked the hero's CSS-3D composite against
"does it improve comprehension/premium perception/storytelling" and it
passes (it shows real product surfaces, not decoration), but it's
worth re-litigating once real screenshots of a *live* (non-demo)
product exist, since a static composite of demo data has a shelf life.

**Generic-looking area:** The marketing site's "Works With Your Stack"
and positioning sections are solid but interchangeable with a well-
executed competitor's site — the field-dashboard hero and the Call-
Ready Brief itself are what actually differentiate Scout visually;
the rest of the marketing page is competent but not distinctive. Not
a defect, just not a strength to over-invest in further right now.

**Biggest usability risk:** Search/filter state on the Target List's
All Accounts view resets on navigation (no URL persistence) — a rep
filtering to "Needs Review," clicking into an account, then hitting
back, loses their filter. Small but real, and exactly the kind of
friction the product exists to eliminate elsewhere.

**Biggest live-data layout risk:** Untested beyond the fixture stress
test — a truly pathological real input (e.g. a company name with
embedded HTML-like characters from a bad CSV export, or a research
finding with an extremely long URL) hasn't been exercised. The stress
tests covered length and emptiness, not malformed content.

**Most visually impressive intentional moment:** The hero's layered
CSS-3D composite — built without a 3D engine dependency, using the
actual Target List/Account Brain/Call-Ready Brief visual language
rather than an abstract illustration. It passes the "would this exist
if the word AI disappeared" test cleanly, since nothing about it
references AI at all — it just shows the product.

**Remaining AI-slop risk:** None found in this pass. Explicit checks
against the anti-slop list (purple gradients, glowing orbs, fake
scores, meaningless charts, giant pills, unnecessary animation) all
came back clean — the funnel visualization uses proportional bar
widths from real counts, not a charting library; priority labels are
text + a small dot, never a percentage.

**Performance risk from design:** The hero composite uses only CSS
transforms (no JS animation loop, no WebGL context) — negligible
runtime cost. No risk identified from this phase's additions.

---

## What would change the council's mind

The same live-data experiment named in the Phase 2 and Phase 3
reviews, now extended: connect a real provider, and additionally get
one real person (ideally an actual salesperson, not the founder) to
use `/demo` cold, without guidance, and see where they get stuck. The
stress-test fixtures prove the UI *can* handle messy data — they don't
prove a real user finds the workflow intuitive.
