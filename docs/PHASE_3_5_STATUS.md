# Phase 3.5 Status — Live Intelligence Validation

> **Superseded by Local Mode** (see `docs/LOCAL_MODE.md`). Phase 3.5 is
> no longer a blocked next step on the roadmap — connecting a live
> research/AI provider is now a permanently-optional future
> enhancement, not something local-first usage is waiting on. Real
> usage today means manually entering your own accounts/contacts/notes;
> everything below is accurate history of why that live-provider
> validation never happened, not a current blocker.

**Status: NOT DONE. No live research or AI provider has ever been
connected to Scout.**

## What Phase 3.5 would have been

A validation pass connecting one real `ResearchProvider` and one real
`AIProvider` (`RESEARCH_ENGINE.md`), running the full pipeline against
10-20 real companies, and measuring: research quality against a human
baseline, latency, cost, source coverage, people coverage, failure
rates, and how messy real output actually is compared to hand-written
demo fixtures. Both the Phase 2 and Phase 3 completion reports
(`PHASE_2_COMPLETION_REPORT.md`, `PHASE_3_COMPLETION_REPORT.md`) named
this as the single highest-leverage next step, ahead of further UI or
architecture work.

## Why it didn't happen

It requires real vendor accounts/API keys (a research/search provider,
an LLM provider) that don't exist yet — see `ANTHROPIC_API_KEY` and
friends sitting empty in `.env.example`. This is a founder decision
(which vendors, what budget), not something that can be substituted by
more code.

## What this means for Phase 4

Per the Phase 4 build prompt's own instruction for this exact
situation: Phase 4's UI/UX and website work proceeds, but the finished
product experience **cannot be declared commercially validated**. Every
"messy real data" requirement in the Phase 4 spec (long company names,
zero-to-many sources, zero-to-many people, ambiguous matches, stale
data, conflicting sources) is instead exercised against **deliberately
extended demo fixtures** built to be harder than the polished Phase 2/3
examples — see `docs/DEMO.md`'s stress-test additions and
`PHASE_4_COMPLETION_REPORT.md`. This is a reasonable substitute for
layout/UX robustness testing; it is not a substitute for knowing
whether real research output is actually good.

## What unblocks Phase 3.5

Founder decision on: which `ResearchProvider` (web search/news), which
`AIProvider` (model vendor), and budget for a real validation pass —
then connect them per `RESEARCH_ENGINE.md`'s existing interface design
and re-run this validation before treating Scout's core intelligence
claims as proven, not just architected.
