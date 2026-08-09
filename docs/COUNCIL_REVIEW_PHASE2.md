# Council Review — Phase 2 (Commercial Product)

Reviewing what actually got built this phase: the Target List/Account
Brain/Post-Call/Analytics data model and domain logic, the demo-mode UI
for all four signature experiences, the runbooks, and the CRM/billing
architecture extensions — against the product spec's own standard:
*"Can the founder sell Scout remotely, onboard real B2B sales teams,
have those reps immediately become more productive, measure whether
Scout creates more meetings and selling situations, support the
customers alone, control costs, and grow the company?"*

---

## FOUNDER — "Did we build something that removes real prospecting friction?"

**Not yet, for a real rep on a real Tuesday — only in demo form.**
Every signature experience (Target List workspace, Call-Ready Brief,
Account Brain, Post-Call flow) exists as working UI against real
domain logic, but reads from a fixed fictional dataset
(`src/demo/fixtures.ts`), not from a live database, live research
provider, or live CRM. The *shape* of the friction removal is real and
demonstrable; the friction hasn't actually been removed for anyone
yet, because there's no live pipeline behind it. This is the honest
gap the Completion Report has to be explicit about, not soften.

## CRO — "Would I genuinely keep Scout open while making calls?"

**The demo UI passes the 30-second scan test** — the Call-Ready Brief
is one continuous page, not a tab maze, and the "No Strong Current
Trigger" / "Limited Data" honesty (Anderson, Bayview) is exactly the
kind of thing that builds rep trust rather than the fake-urgency
pattern that kills it fast. What's unverified: whether the *actual*
research quality, once a live provider is connected, produces content
this good consistently. The demo's narrative content
(`DEMO_ACCOUNT_BRIEFS`) was hand-written to be good — a real
`LLMProvider.summarize` call over messy real evidence is a different,
harder bar, and nothing in Phase 2 proves it clears that bar yet.

## CFO — "Can we research accounts and support customers profitably?"

**Instrumentation exists (`COST_MODEL.md`, `UsageRecord`), real spend
data doesn't.** Every cost-control mechanism described in
`COST_MODEL.md`/`RESEARCH_WORKSPACE.md` (caching, incremental refresh,
cheap-model extraction) is designed but unmeasured — there's no live
research provider to generate real per-account cost numbers against.
Pricing (`PILOT.md`'s $199/$499/$999 placeholders) remains explicitly
unvalidated. This isn't a Phase 2 failure — real cost data requires a
live provider connection, which is correctly deferred — but it means
the CFO's core question is still open after this phase, not answered.

## CTO — "Can one founder safely operate this?"

**Foundations are solid; the operational surface is still small.**
Dual-layer authorization (RLS + app-level, ADR-0004) extends cleanly
to every new Phase 2 table (`0002_core_product.sql`). Platform-admin
access (ADR-0007) is a deliberately separate, non-self-service flag.
12 runbooks exist for failure modes that don't have live systems to
fail yet — genuinely useful ahead-of-need, but unvalidated against
reality (a runbook's first real test is always messier than its
authoring). The admin console is a labeled, unauthenticated stub — the
explicit warning banner in `src/app/admin/page.tsx` is the correct
call, but it means the founder cannot actually operate customers
through it yet.

## CUSTOMER (VP of Sales) — "Would I pay for this after seeing measurable pilot results?"

**Can't be answered yet — no pilot has run, because no live research/
CRM/billing exists to run one against.** `PILOT.md`'s measurement
framework (real events, real denominators, never "did you like the
AI") is sound and directly implemented in `src/domain/analytics.ts`
with test coverage. What's missing is the actual pilot: a real
customer, real accounts, real calls. This is the single biggest gap
between "the architecture is ready" and "the company has revenue."

---

## Cross-cutting risk identification

**Biggest product weakness:** The gap between demo-mode polish and
live-mode reality is currently invisible to anyone who only sees the
demo. A prospect shown `/demo` today would reasonably assume the
research is live. The founder must be explicit in every demo that this
is Demo Mode (`DEMO.md` already says this in the repo; it needs to be
said out loud in the room too) — a prospect discovering later that the
polished research they saw was hand-written fiction would be a trust
failure worse than not demoing at all.

**Biggest adoption risk:** Nothing built this phase proves reps will
actually log call outcomes and use the post-call flow consistently —
product spec §38 itself flags this ("if reps avoid logging because it
is annoying, the analytics become useless"). The UI is fast
(`OutcomeBadge`, one-field logging) but *fast in a demo* and *fast
enough that a busy rep actually does it 30 times a day* are different
bars, unverified.

**Largest financial risk:** Real AI/research cost per account is
completely unmeasured — see CFO section above. The first live customer
essentially doubles as the first real cost experiment.

**Largest data-quality risk:** Entity resolution (ADR-0005,
`src/domain/entity-resolution.ts`) is conservative by design, which is
correct, but its fuzzy-match threshold was *wrong* until this
session's own test suite caught it (originally unreachable at 0.8,
fixed to 0.5 — see `tests/entity-resolution.test.ts`). That the bug
was real and caught by a test, not by inspection, is itself the
argument for why `TESTING`-priority logic (`ARCHITECTURE.md`) matters;
it's also a reminder that untested logic elsewhere in this phase may
have similar latent bugs not yet surfaced by a test that happens to
exercise the wrong case.

**Largest support risk:** Twelve runbooks exist for failure modes with
no live system to generate them yet. The founder's actual first
incident will likely not match any runbook exactly — the value is in
having practiced the *shape* of "diagnose scope → snapshot → fix →
communicate," not in any single runbook being a perfect script.

**Most dangerous assumption:** That connecting a real `ResearchProvider`
and `LLMProvider` to this architecture will produce brief content close
in quality to the hand-written demo fixtures. Nothing in this phase
tests that. It's the single highest-leverage thing to validate next —
higher leverage than any additional UI polish — because if real
research quality is materially worse than the demo, every other
Phase 2 deliverable (analytics, post-call flow, CRM writeback) inherits
that weakness downstream.

---

## What would change the council's mind on any of the above

Real evidence from one live research provider connection, run against
a handful of real companies, compared side-by-side with the demo
fixtures' quality bar. That single experiment resolves more open
questions in this review than any further architecture or UI work
would.
