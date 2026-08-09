# Council Architecture Review

Reviewing: the full Phase 0 architecture (`ARCHITECTURE.md`,
`DATA_MODEL.md`, `RESEARCH_ARCHITECTURE.md`, `AI_ARCHITECTURE.md`,
`SECURITY.md`, `INTEGRATIONS.md`, `COST_MODEL.md`, `JOBS_ARCHITECTURE.md`).
Format per `PRODUCT_CONSTITUTION.md`.

---

## Proposal 1: Modular monolith, Supabase-centric stack (ADR-0001, ADR-0002)

**Founder:** APPROVE — gets to a usable product fastest; a solo founder
fighting infrastructure instead of building the Daily Plan is the
actual risk, not Supabase lock-in.

**CRO:** APPROVE — no opinion on backend architecture; only cares that
it doesn't slow down getting a working product in front of a real rep.

**CFO:** APPROVE — Supabase's bundled pricing beats hand-rolling
separate auth/infra/storage vendors at this stage; revisit if usage
scales past Supabase's pricing sweet spot.

**CTO:** REVISE — approve the direction, but flag the lock-in risk
explicitly (auth + data on one platform is a bigger migration later
than either alone) and require the mitigation in ADR-0002 (wrapped
auth interface, portable RLS SQL) as a condition, not a nice-to-have.

**Customer:** APPROVE — indifferent to backend choice; cares whether
the product works and their data is safe, which is a `SECURITY.md`
question, not a stack question.

**FINAL DECISION: PROCEED**, with CTO's mitigation requirement treated
as binding (reflected in ADR-0002, not optional follow-up).

---

## Proposal 2: Dual-layer authorization (app-level + RLS) (ADR-0004)

**CTO:** Initially proposed RLS-only — one mechanism to build, test,
and reason about, and RLS is the harder-to-forget backstop anyway.

**Founder:** REJECT the RLS-only version — a debugging query, an admin
script, or a future internal tool bypasses RLS's protection the same
way it'd bypass app checks, except it's invisible in code review the
way an explicit `WHERE organization_id = ...` is visible. For a
product whose entire pitch is "trust us with your confidential sales
data," this is not the place to cut a corner for implementation
convenience.

**CRO:** APPROVE dual-layer — no rep-facing impact either way, but "we
got breached because of a debug query" is the kind of story that kills
a small B2B software company's ability to sell to skeptical VPs of
Sales.

**CFO:** APPROVE dual-layer — the extra implementation cost is small
relative to the cost of a single tenant-isolation incident (lost
customers, reputational damage, possible legal exposure) — this is not
where to optimize for engineering speed.

**Customer (VP of Sales):** APPROVE dual-layer, strongly — "can Company
A see Company B's data" is one of the first questions asked in any real
sales-software evaluation; a defense-in-depth answer is a selling
point, not just an internal detail.

**CTO:** REVISE to dual-layer, accepting the Founder's argument — the
extra layer's cost is justified by the failure mode's severity.

**FINAL DECISION: PROCEED with dual-layer (ADR-0004).** This is the
review's clearest real disagreement — recorded as such, not smoothed
over.

---

## Proposal 3: Entity resolution — conservative auto-merge only (ADR-0005)

**Founder:** REVISE (initially) — wanted more aggressive AI-assisted
auto-merging; a review queue full of "is ABC Inc the same as ABC
Incorporated" questions is exactly the kind of friction that kills
time-to-value in onboarding (see `PRODUCT_CONSTITUTION.md`'s emphasis
on fast time-to-value).

**CRO:** REJECT the aggressive version — a Tuesday-morning rep who
opens an account and finds two customers' histories quietly merged
into one wrong account loses trust in the product instantly, and won't
articulate why, they'll just stop trusting Scout's data generally.

**CTO:** REJECT the aggressive version — a wrong merge is
data corruption in the product's core asset (institutional memory);
it's not correctable by "just re-import," because by the time it's
noticed, real interactions may have been logged against the wrong
merged account.

**CFO:** REVISE — agrees conservative is right for correctness, but
flags that onboarding friction has a real cost (higher churn during
trial) and asks that the review-queue UX be a first-class Phase 2
concern, not an afterthought bolted onto Phase 4.

**Customer:** APPROVE conservative — "don't guess wrong with my data"
beats "save me a few clicks during import," explicitly, when asked
directly what a VP of Sales would actually want.

**FINAL DECISION: PROCEED conservative (ADR-0005)**, with CFO's
condition — review-queue UX quality is added to Phase 2 scope, not
deferred to Phase 4 (see `ROADMAP.md`).

---

## Cross-cutting risk identification (per source brief §Step 9)

**Largest product risk:** The Daily Plan and Account Brain have to
feel obviously, immediately more useful than "another dashboard" on
first use, or a busy rep with existing habits won't come back a second
morning — the CRO's standing question ("would an actual salesperson
use this on a Tuesday morning") is unproven until real reps touch it.
No amount of architecture correctness fixes a product that doesn't
clear this bar.

**Largest technical risk:** Institutional-memory correctness
(entity resolution + KnowledgeItem provenance) under genuinely messy
real-world CRM exports, which are worse than any test fixture will
anticipate — inconsistent column layouts, mixed date formats, years of
conflicting notes. The architecture is designed for this (§DATA_MODEL,
§ADR-0005) but the design is unproven against real customer data.

**Largest financial risk:** Research/AI cost per account at real usage
volume is currently an estimate, not a measured number (see
`COST_MODEL.md`'s deferred unit-economics section) — pricing decisions
made before real cost data exists could set an unprofitable floor that's
hard to raise later without alienating early customers.

**Largest customer-adoption risk:** A 20-person B2B sales org with no
RevOps has limited tolerance for setup friction — if Sales Profile
creation + CSV import + column mapping doesn't produce visible value
within the first session, the target customer (time-poor, skeptical of
new tools per `PRODUCT_CONSTITUTION.md`) will not return for session
two. Time-to-value is a metric, not a slogan, and nothing in Phase 0
proves it yet.

**Most dangerous assumption:** That existing CRM/spreadsheet data,
once imported, is *rich enough* to produce a Daily Plan meaningfully
better than a rep's own gut instinct. If most target customers'
historical data turns out to be too sparse (a name and a phone number,
no real notes), the "institutional memory" pitch has much less to work
with than the product concept assumes, and the Research Engine has to
carry more weight than planned — which raises the financial-risk
concern above. This is the assumption most worth testing early, with
a real customer's real messy spreadsheet, before building deep into
Phase 3+.

---

## What the council did NOT unanimously resolve (left open, not hidden)

Whether V1 should ship any territory/manager-visibility restriction at
all, or defer it entirely to Phase 6 — Founder and CFO lean toward
deferring (simpler V1), CTO leans toward building the permission
*shape* now even if enforcement is loose initially (cheaper than
retrofitting). Current architecture takes the CTO's position on the
interface shape (see `SECURITY.md`) without fully building enforcement
— treated as a reasonable middle ground, not a resolved disagreement.
