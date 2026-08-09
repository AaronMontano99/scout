# Product Constitution

Working name: **Scout** (internal only — see "Naming" below; do not
couple code/DB/URLs to this name).

This document is binding on every product, engineering, and design
decision made in this repository. When a decision conflicts with this
document, the decision changes, not the document — unless the document
itself is deliberately revised via an ADR (`DECISIONS.md`).

## Mission

Scout is a sales intelligence layer for small and midsize B2B sales
organizations. It turns fragmented, decaying institutional knowledge —
CRM notes, spreadsheets, rep tribal knowledge, past interactions,
external research — into a prioritized, explainable daily plan: who to
contact, why, what the organization already knows, who likely matters
in the buying process, and what angle to use.

**Core philosophy: we do not sell AI. We sell better-prepared
salespeople.** AI is infrastructure. The customer purchases the
outcome. Every AI-adjacent product decision should be justifiable
without ever mentioning "AI" as the value proposition.

## The core product question

> Who should this salesperson contact today, why should they contact
> them, and what does our organization already know that can help
> them?

Every feature is evaluated against this question (see `ROADMAP.md`'s
feature-creep rule). If a feature doesn't materially move this answer,
it's a candidate for rejection regardless of how compelling it sounds
in isolation.

## Primary customer (V1)

Not enterprise. Target: $2M–$50M revenue, 20–250 employees, 3–30
salespeople, B2B sales motion, little/no RevOps, existing but messy
customer/prospect data, leadership wanting smarter prospecting without
an enterprise stack. Candidate verticals: office technology dealers,
MSPs, cybersecurity providers, telecom providers, commercial security,
staffing, commercial insurance, payroll/HR services, industrial
distribution, contractors, logistics, other traditional B2B service
orgs. The architecture stays horizontal enough to serve software sales
and other verticals later — vertical focus is a go-to-market choice,
not an architectural constraint.

## The problem

Sales organizations already possess valuable account knowledge; it's
fragmented across people, tools, and time. A departed rep's 2017 note
about who the real decision maker is doesn't disappear from the
company's possession — it disappears from practical reach. Scout's job
is to become **the institutional memory of the sales organization**,
surviving employee turnover, with new external research augmenting
that memory rather than replacing it.

## V1 scope — six things done extremely well

1. **Sales Profile** — what the customer sells, ICP, deal size, sales
   cycle, common buyers/influencers/champions, objections,
   disqualifiers.
2. **Data Ingestion** — CSV/XLSX first (the universal integration),
   architected for CRM/enrichment adapters later without a rewrite.
3. **Account Brain** — persistent, cumulative, provenance-preserving
   record per account.
4. **People Intelligence** — KNOWN / INFERRED / SUGGESTED, never
   blurred.
5. **Research Engine** — modular evidence providers, always sourced,
   dated, and confidence-scored.
6. **Daily Plan** — ranked, explainable, willing to say "don't work
   this account today."

## Hard non-goals for V1

Scout is **not**: a CRM replacement, an email sequencer, a dialer, a
call-recording platform, an AI SDR, an automated LinkedIn bot, an
automated social-outreach tool, a proposal generator, a forecasting
platform, a ZoomInfo/Apollo/Sales Navigator replacement, a RevOps
platform, or a desktop app. Scout complements the tools a customer
already owns. See `ROADMAP.md` for the phase plan that keeps this
boundary real rather than aspirational.

## Trust principles (binding, not aspirational)

- Never present an AI inference as a known fact. KNOWN / INFERRED /
  SUGGESTED is a first-class data distinction, not UI copy — see
  `DATA_MODEL.md` and `AI_ARCHITECTURE.md`.
- Never silently overwrite historical knowledge with newer information
  — preserve provenance, mark superseded, don't delete (`DATA_MODEL.md`
  §KnowledgeItem).
- No account score is ever an unexplained number. Every score
  decomposes into evidence a user can inspect (`DATA_MODEL.md`
  §AccountScore, `AI_ARCHITECTURE.md`).
- No LinkedIn scraping, connection automation, or messaging automation,
  ever, regardless of technical feasibility or competitive pressure —
  see `SECURITY.md` and `INTEGRATIONS.md`.
- Customer data belongs to the customer: exportable, deletable, never
  used to train cross-customer shared models without a future explicit
  opt-in policy that doesn't exist yet (`SECURITY.md` §Data Ownership).

## Naming discipline

"Scout" is a working name that will likely change. No table name, URL
path, environment variable, component name, or service name may encode
the word "Scout" in a way that would require a rename to change brand.
Branding lives in a small config/theme layer (`src/lib/branding.ts` or
equivalent) — see `ARCHITECTURE.md`.

## The Five-Person Council

Major product, engineering, pricing, data, infrastructure, and UX
decisions get evaluated through five personas before they're locked
in. The council exists to prevent AI-generated agreement and feature
creep — genuine disagreement, reasoned from each persona's actual
incentives, is the point.

### 1. Founder / Product
*"Does this materially improve the salesperson?"* Owns product vision,
UX, differentiation, simplicity, innovation. Bias: willing to
experiment. Risk: wants too many features.

### 2. CRO / Veteran Sales Rep (20+ years B2B)
*"Would an actual salesperson use this on a Tuesday morning?"* Owns
workflow realism, prospecting usefulness, account prioritization, rep
adoption, manager usefulness. Bias: practicality. Risk: favors familiar
workflows over innovation.

### 3. CFO / Finance Director
*"Can this become a profitable recurring-revenue company?"* Owns API/
inference cost, gross margin, pricing, infra expense, CAC, retention,
expansion revenue, unit economics, engineering-complexity cost. Bias:
protect margins. Risk: underinvests in strategically important
capability.

### 4. CTO / Security Architect
*"Can we build, operate, secure, and scale this responsibly?"* Owns
system/database architecture, APIs, queues, reliability, permissions,
auth, encryption, multi-tenancy, observability, compliance readiness,
third-party dependency risk, data ownership. Bias: reliability and
security. Risk: over-engineers.

### 5. Customer / VP of Sales (manages 10–25 reps, controls budget)
*"Would I actually pay for this?"* Owns ROI, rep adoption,
implementation friction, manager visibility, productivity, meetings/
pipeline generated, onboarding difficulty, subscription value. Bias:
business outcomes. Risk: demands features before the core product is
proven.

### Decision format

```
PROPOSAL:

Founder:   APPROVE / REVISE / REJECT — reason
CRO:       APPROVE / REVISE / REJECT — reason
CFO:       APPROVE / REVISE / REJECT — reason
CTO:       APPROVE / REVISE / REJECT — reason
Customer:  APPROVE / REVISE / REJECT — reason

FINAL DECISION: PROCEED / MODIFY / KILL
```

Unanimity is not required and should not be manufactured. Meaningful
architecture decisions get recorded as ADRs in `DECISIONS.md`.

## Feature-creep rule

Before adding anything, ask whether it improves: **who should I
contact, why should I contact them, what do we already know, what
should I do next.** If it doesn't, the default is to reject it — see
`ROADMAP.md`.
