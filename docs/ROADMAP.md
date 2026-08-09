# Roadmap

## Feature-creep rule (apply before adding anything)

Does this materially improve the answer to: **who should I contact,
why should I contact them, what do we already know, what should I do
next?** If not, the default is rejection — see `PRODUCT_CONSTITUTION.md`.

## Hard non-goals (V1 and, absent a deliberate future decision, beyond)

Not a CRM replacement, email sequencer, dialer, call-recording
platform, AI SDR, LinkedIn bot, social-outreach automation tool,
proposal generator, forecasting platform, ZoomInfo/Apollo/Sales
Navigator replacement, RevOps platform, or desktop app. Scout
complements existing tools; it does not try to replace the sales
stack.

## Phases

### Phase 0 — Foundation (this repo's current phase)
Architecture docs (this set), repo structure, environment strategy,
database plan, security model, provider interfaces, design tokens, CI
foundation. See Architecture Readiness Report for exit criteria.

### Phase 1 — SaaS shell
Authentication, Organizations, Memberships, Roles, application shell,
marketing shell.

### Phase 2 — Sales Profile + Import
Sales Profile onboarding, CSV/XLSX ingestion, column mapper, import
validation, Account creation, historical note ingestion.

### Phase 3 — Account Brain
Account page, knowledge timeline, contacts, KNOWN/INFERRED/SUGGESTED
classification surfaced in UI, provenance display.

### Phase 4 — Research Engine
Background jobs, research adapters (starting with one real
`ResearchProvider`), evidence collection, structured extraction,
signals, account briefs.

### Phase 5 — Prioritization
Account scoring, score explanations, Daily Plan, recommendation
reasoning.

### Phase 6 — Team + Billing
Invitations, roles in practice, manager views, usage controls,
Stripe subscriptions.

### Phase 7 — Integrations
CRM connectors, enrichment connectors, other approved third-party
integrations. **Not before Phase 1-6 are real** — the source brief is
explicit that skipping ahead to integrations before the core loop
works is a failure mode, not ambition.

## MVP definition of success

A customer can: create an account → describe what they sell → upload
an ordinary spreadsheet → import accounts and historical notes → have
Scout understand that history → research selected accounts → open an
account and understand what's known vs. inferred → see why an account
matters → receive a prioritized Daily Plan → understand why each
recommendation was generated. That's sufficient to sell V1 — nothing
past this list is required to start charging money.

## Deferred decisions (tracked, not forgotten — promote to DECISIONS.md when resolved)

- Exact `AccountScore` formula and component weights.
- Pricing tiers and exact per-org usage limits.
- Data retention policy specifics (how long after org offboarding).
- Territory hierarchy beyond one level.
- SalesProfile versioning as a first-class table vs. AuditLog-derived
  history.
- Which `ResearchProvider` vendor(s) to integrate first in Phase 4.
- Self-serve entity-resolution rule authoring.

## Architectural failure conditions (reject any design that does these)

Requires LinkedIn scraping; depends entirely on one enrichment vendor;
requires enterprise infra before any paying customer exists; creates
unnecessary microservices; hides recommendations behind unexplained AI
scores; mixes tenants; treats embeddings as the primary database;
destroys historical knowledge; turns Scout into another CRM; enables
autonomous outbound spam; requires dozens of integrations before
launch; creates large AI cost per account; forces customers to abandon
existing systems; optimizes for a flashy demo over daily usefulness.
