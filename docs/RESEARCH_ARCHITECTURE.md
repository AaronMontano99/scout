# Research Architecture

## Pipeline

```
ACCOUNT CREATED / IMPORTED
  ↓
NORMALIZE ACCOUNT            (name/domain normalization — DATA_MODEL.md)
  ↓
ENTITY RESOLUTION            (deterministic → normalized+signal → fuzzy/AI → human review)
  ↓
RETRIEVE INTERNAL KNOWLEDGE  (existing KnowledgeItems, prior ResearchFindings — never re-fetch what we already have)
  ↓
CHECK RESEARCH CACHE         (has this account/question been researched recently enough?)
  ↓
GATHER EXTERNAL EVIDENCE     (ResearchProvider.searchCompany / findSignals / retrieveEvidence)
  ↓
NORMALIZE EVIDENCE           (common shape regardless of provider)
  ↓
DEDUPLICATE                  (against internal knowledge AND across providers)
  ↓
EXTRACT STRUCTURED FACTS     (LLMProvider.extractStructuredData, schema-validated — AI_ARCHITECTURE.md)
  ↓
CLASSIFY SIGNALS             (LLMProvider.classify against Signal taxonomy)
  ↓
COMPARE AGAINST SALES PROFILE (does this evidence matter to *this* seller?)
  ↓
IDENTIFY BUYING-COMMITTEE HYPOTHESES (AccountContactRelationship candidates, certainty_type=SUGGESTED at best)
  ↓
CALCULATE SCORE COMPONENTS   (AccountScoreComponent rows)
  ↓
GENERATE ACCOUNT BRIEF       (LLMProvider.summarize, evidence-linked)
  ↓
SAVE PROVENANCE + EVIDENCE   (Source, ResearchFinding, KnowledgeItem rows)
  ↓
UPDATE DAILY PLAN            (triggers rescoring for affected accounts)
```

Every stage is a distinct, independently retryable step in the
background-job graph (`JOBS_ARCHITECTURE.md`) — not one monolithic
function. A failure in "classify signals" should not force re-running
"gather external evidence" against paid providers.

### Idempotency and retries

- `ResearchRun` is the unit of idempotency. Re-running a completed
  `ResearchRun` for the same account within the cache window is a
  no-op that returns cached results, not a new provider call.
- Each pipeline stage writes its output keyed by `research_run_id` +
  stage name, so a retry resumes from the last completed stage instead
  of restarting the whole run.
- Provider calls are logged (`ResearchRun.provider_calls`) before
  being trusted as complete, so a crash mid-call doesn't silently
  double-charge on retry — check the log before calling, not just
  after.

## Provider interfaces

All external dependencies sit behind interfaces defined in domain
terms. Concrete vendors implement these interfaces in
`src/integrations/`; domain and intelligence code (`src/domain`,
`src/ai`) only ever import the interface types from `src/services` or
`src/types`, never a vendor SDK.

```typescript
// src/services/crm-provider.ts
export interface CRMProvider {
  connect(orgId: string, authPayload: unknown): Promise<IntegrationConnection>;
  syncAccounts(orgId: string, since?: Date): AsyncIterable<RawCRMAccount>;
  syncContacts(orgId: string, since?: Date): AsyncIterable<RawCRMContact>;
  syncNotes(orgId: string, since?: Date): AsyncIterable<RawCRMNote>;
  pushUpdates(orgId: string, updates: CRMUpdate[]): Promise<PushResult>;
}

// src/services/enrichment-provider.ts
export interface EnrichmentProvider {
  enrichCompany(input: CompanyIdentifier): Promise<EnrichmentResult<CompanyEnrichment>>;
  enrichPerson(input: PersonIdentifier): Promise<EnrichmentResult<PersonEnrichment>>;
  // cost is always reported so UsageRecord can be written before the
  // caller decides whether the result was worth it
  estimateCost(input: CompanyIdentifier | PersonIdentifier): Promise<CostEstimate>;
}

// src/services/research-provider.ts
export interface ResearchProvider {
  searchCompany(input: CompanyIdentifier): Promise<RawEvidence[]>;
  findSignals(input: CompanyIdentifier, salesProfile: SalesProfileContext): Promise<RawEvidence[]>;
  retrieveEvidence(ref: EvidenceReference): Promise<RawEvidence>;
}

// src/services/llm-provider.ts  (see AI_ARCHITECTURE.md for full contract)
export interface LLMProvider {
  extractStructuredData<T>(input: ExtractionInput<T>): Promise<StructuredResult<T>>;
  classify(input: ClassificationInput): Promise<ClassificationResult>;
  reason(input: ReasoningInput): Promise<ReasoningResult>;
  summarize(input: SummarizationInput): Promise<SummaryResult>;
  embed(input: string | string[]): Promise<number[][]>;
}

// src/services/import-provider.ts — CSV/XLSX is the first, universal
// "integration" and gets the same interface shape as everything else
export interface ImportProvider {
  parse(file: Buffer, fileType: 'csv' | 'xlsx'): Promise<ParsedTable>;
  inferColumnMapping(table: ParsedTable, target: 'account' | 'contact' | 'knowledge_item'): Promise<ColumnMappingSuggestion>;
}
```

Every result type (`RawEvidence`, `EnrichmentResult`, etc.) carries
`source`, `retrievedAt`, and — where applicable — `relevantDate`,
matching `ResearchFinding`'s schema directly, so normalization into the
database is a straight mapping rather than a bespoke transform per
provider.

## Caching and cost strategy

- **Cache before call.** Every external call checks `ResearchRun`/
  `ResearchFinding` freshness before hitting a paid provider. Default
  cache window is configurable per finding type (e.g. "leadership
  change" facts are cheap to treat as durable; "hiring signal" facts
  decay faster).
- **Incremental, not full re-research.** Scheduled refreshes target
  accounts with actual reason to re-check (score near a threshold,
  time since last research, explicit user request) — not a blanket
  nightly re-run of every account in every organization.
- **Cheap models for extraction/classification, stronger models only
  for reasoning/summarization** where the added quality is worth the
  cost — model selection lives in config (`AI_ARCHITECTURE.md`), not
  hardcoded per call site.
- **Per-organization research budgets** (`UsageRecord` aggregation)
  with queue-level concurrency controls so one customer's research
  burst can't starve another tenant's jobs or blow past their plan's
  cost allowance. See `COST_MODEL.md`.

## Explicit non-dependencies

- **No LinkedIn scraping, browser automation, or connection/messaging
  automation, ever** — LinkedIn is architected only as a future
  *approved* integration (official API, if/when Scout's use case
  qualifies for one), never as a scraping target. This is a hard
  constraint from `PRODUCT_CONSTITUTION.md`, not a cost-driven
  deferral.
- **No single enrichment/research vendor is load-bearing.** The
  `EnrichmentProvider`/`ResearchProvider` interfaces exist specifically
  so ZoomInfo, Apollo, or any other vendor can be swapped without
  touching domain or intelligence code.
