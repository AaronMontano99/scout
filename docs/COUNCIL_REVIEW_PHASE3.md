# Council Review — Phase 3 (Research Engine)

Reviewing what got built: entity resolution extensions, source-tier
conflict resolution, freshness windows, a research-status state
machine, SSRF/prompt-injection defenses, a brief-quality lint with a
real golden-regression test, and the UI wiring of all of it into the
existing Target List/Account Brief pages — against the product spec's
own standard: *"Fast enough to keep the rep moving. Accurate enough to
trust. Concise enough to use. Cheap enough to sell profitably. Sourced
enough to verify."*

---

## FOUNDER — "Does Scout actually replace hours of manual research?"

**The demo shows the shape of the answer, not the answer itself, same
gap as Phase 2 — but the shape got materially more rigorous this
phase.** The conflict-resolution logic (`resolveConflict()`), freshness
windows, and entity-resolution signal hierarchy are no longer just
described in prose — they're real, tested functions a live pipeline
could call today. What's still unproven: whether real web research,
run through this logic, actually surfaces the "what matters" bullets a
rep would have spent 20 minutes finding manually. That test still
requires a live provider connection — unchanged from Phase 2's
assessment, but the scaffolding waiting for that connection is now
substantially more complete.

## CRO — "Would I confidently make a call from this brief?"

**More confidently than Phase 2's brief, for one specific reason: the
conflict-resolution and staleness signals are now real, not just
narrative.** The Vantage Point Builders example (CRM says John Smith,
website says Sarah Lee) is exactly the kind of thing that erodes trust
if handled wrong — showing both, correctly ordered by recency-among-
trusted-tiers, with the historical one visually struck through, is the
right call. The `research_status` banner ("Research in progress" /
"Limited public information found") also directly answers "should I
trust what I'm looking at right now," which the Phase 2 brief didn't
explicitly surface. Unresolved: none of this has been tested against a
rep's actual gut reaction to a *real* conflicting-evidence case, only
a hand-built one.

## CFO — "Can we research large lists without destroying gross margin?"

**Real cost-control logic exists now; real cost data still doesn't.**
`canReuseCache()`, `deduplicateByContentHash()`, and
`shouldSkipResolution()` are concrete, tested mechanisms against the
three biggest cost multipliers described in the product spec (redundant
refresh, redundant extraction, redundant identity resolution) — this
is meaningfully more than Phase 2 had. But every number in
`RESEARCH_COSTS.md` is still hypothetical. The CFO's question is
answerable in principle now; it's not answerable in dollars yet, and
won't be until a live provider runs against a real list.

## CTO — "Can this pipeline run reliably and be supported by one founder?"

**Yes, on the parts that exist — SSRF and prompt-injection defenses in
particular are real, tested security code, not just policy language**
(`isSafeSourceUrl()` explicitly rejects the AWS/GCP metadata endpoint,
the single most common real-world SSRF target; `wrapUntrustedContent()`
gives every future prompt a concrete, non-optional untrusted-content
boundary). The research-status state machine
(`src/domain/research-status.ts`) has no dead-end states, verified by
test, which matters directly for one-founder support — a state with no
valid exit is exactly the kind of thing that produces a support ticket
with no clear resolution path. Gap: none of this has run against a
live job queue yet, so "reliable in practice" is still unverified,
only "reliable in design."

## CUSTOMER (VP of Sales) — "Would my reps trust and actually use this information?"

**Unchanged from Phase 2's honest answer: can't be verified without a
real pilot.** What's different this phase is that the *specific things*
that would break trust fastest — a wrong company match presented
confidently, a stale contact presented as current, an unsupported
inference presented as fact — now each have a real, tested mechanism
preventing them, not just a design intention. That's progress toward
"would trust it," even though "actually use it daily" still requires
real reps using it.

---

## Cross-cutting risk identification

**Biggest accuracy risk:** Entity resolution has never processed a
real messy spreadsheet — every test case in
`tests/entity-resolution.test.ts` is hand-constructed to exercise a
specific rule. Real import data will have variations (abbreviations,
typos, multiple locations under one legal name) the fuzzy-matching
logic hasn't been stress-tested against. This was true in Phase 2 too
and remains the single most likely place for real accuracy problems to
surface first.

**Biggest latency risk:** No live pipeline has run end-to-end, so
per-account research latency is completely unmeasured. The
parallelism design (website/news/people concurrently after identity
resolution) is sound on paper but untested against real provider
response-time variance.

**Largest cost risk:** Unchanged from Phase 2 — real per-account
research cost remains the single largest unknown in the whole
business model, now with better cost-control *mechanisms* in place but
zero real cost *data*.

**Most fragile provider dependency:** Whichever single
`ResearchProvider`/`AIProvider` gets connected first, by construction —
until a second provider is actually integrated, the "provider
independence" architecture (`INTEGRATIONS.md`) is a design property,
not a demonstrated one. `PROVIDER_OUTAGE.md`'s failover guidance is
untested against a real outage.

**Most common hallucination risk:** Company-specific evidence being
thin enough that generation defaults toward generic industry framing —
exactly what `CALL_READY_BRIEF.md`'s "company-specific evidence beats
generic industry theory" rule exists to prevent, but that rule has
only been exercised against hand-written demo content, never against a
model under pressure to fill a "What Matters" section with too little
real evidence.

**Most likely source-quality issue:** Tier misclassification at
ingestion — the 5-tier hierarchy is only as good as whatever assigns a
tier to a newly-fetched source, and that assignment logic doesn't
exist yet (no live fetching). A tier-5 source misclassified as tier-2
would silently defeat `resolveConflict()`'s entire protection.

**Biggest people-data weakness:** No live enrichment or professional-
data provider is connected, so 100% of "who's relevant" data in the
product today is either demo fixture content or first-party CRM/import
data. `PEOPLE_DISCOVERY.md`'s multi-source design is real; the actual
source diversity it depends on doesn't exist yet.

**Most unnecessary research step (candidate for cutting):** None
identified this phase that weren't already flagged in Phase 2 — the
research pipeline stages all map to real product requirements. If
anything, the Council's concern is the opposite: whether the
*people-discovery* stage specifically is worth its cost relative to
company-level research, given how much of the product's value (per the
founder's own framing) is "what matters about this company," with
people as a secondary need. Worth revisiting once real cost data
exists, not worth cutting speculatively now.

**Strongest research differentiator:** The combination of persistent
identity (`shouldSkipResolution`) + conflict-aware freshness
(`resolveConflict` + `canReuseCache`) + honest partial-success states
(`isUsable`) is a genuinely coherent design that most "call an LLM to
summarize the web" competitors don't build — it's the mechanism behind
the founder's own stated differentiator ("Scout already did the
homework," not "Scout guessed at homework"). This is real, tested, and
ready — it just hasn't been proven against live data yet.

---

## What would change the council's mind

The same experiment Phase 2's review named, now more specifically
scoped: connect one real `ResearchProvider` and one real `AIProvider`,
run the full pipeline (including `resolveConflict`, `canReuseCache`,
entity resolution) against 10-20 real companies with genuinely messy
source data, and compare the result against what a rep would have
found manually in the same time. Every other open question in this
review is downstream of that one experiment.
