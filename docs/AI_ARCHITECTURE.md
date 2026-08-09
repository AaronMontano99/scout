# AI Architecture

## Provider abstraction

```typescript
// src/ai/provider.ts
export interface AIProvider {
  classify(input: ClassificationInput): Promise<ClassificationResult>;
  extractStructuredData<T>(input: ExtractionInput<T>): Promise<StructuredResult<T>>;
  reason(input: ReasoningInput): Promise<ReasoningResult>;
  summarize(input: SummarizationInput): Promise<SummaryResult>;
  embed(input: string | string[]): Promise<number[][]>;
}
```

No file outside `src/ai/providers/*` may import a model vendor SDK
(Anthropic, OpenAI, etc.) directly. Model name and provider selection
live in config (`src/ai/config.ts`), keyed by **workload**, not
hardcoded at call sites:

```typescript
// src/ai/config.ts (illustrative)
export const AI_WORKLOAD_CONFIG = {
  extraction:     { provider: 'anthropic', model: env.AI_MODEL_EXTRACTION },
  classification: { provider: 'anthropic', model: env.AI_MODEL_CLASSIFICATION },
  reasoning:      { provider: 'anthropic', model: env.AI_MODEL_REASONING },
  summarization:  { provider: 'anthropic', model: env.AI_MODEL_SUMMARY },
  embedding:      { provider: 'anthropic', model: env.AI_MODEL_EMBEDDING },
} as const;
```

Business logic calls `aiProvider.extractStructuredData(...)` and never
knows or cares which model answered. This makes "use a cheaper model
for classification, a stronger one for reasoning" (source brief §19,
cost architecture) a config change, not a refactor — and makes
swapping vendors entirely a config + adapter change, not a rewrite of
domain code.

## Schema validation — never trust free-form output

Every `extractStructuredData` call is bound to a schema (Zod, matching
the target type `T`) and validated before the result is allowed to
touch the database. A response that fails validation is a failed job,
not a best-effort save of malformed data. This is one of the highest-
priority test targets in the whole system — see `docs/ARCHITECTURE.md`
§Testing and `TESTING` notes below.

```typescript
export async function extractIncumbentVendor(
  evidence: RawEvidence
): Promise<StructuredResult<{ incumbentVendor: string | null; confidence: number }>> {
  const schema = z.object({
    incumbentVendor: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  });
  const raw = await aiProvider.extractStructuredData({ evidence, schema });
  return schema.parse(raw); // throws → job fails loudly, never silently coerced
}
```

## Trust rules (binding — see PRODUCT_CONSTITUTION.md)

Maintain hard separation between: **FACT** (directly observed/stated,
e.g. a CRM field), **USER-PROVIDED INFORMATION**, **FIRST-PARTY
HISTORICAL INFORMATION** (a past rep's note), **EXTERNAL EVIDENCE** (a
`ResearchFinding`), **INFERENCE** (AI-derived from evidence), and
**RECOMMENDATION** (the product's suggested action). These map
directly to `KnowledgeItem.certainty_type` and `origin` —
`KNOWN` / `INFERRED` / `SUGGESTED` is not UI copy, it's a database
column that every rendering surface must respect.

**An AI inference never gets silently promoted to KNOWN.** If a
classification or extraction step produces a claim, the resulting
`KnowledgeItem`/`ResearchFinding`/`AccountContactRelationship` row is
created with `certainty_type = INFERRED` or `SUGGESTED` by construction
— there is no code path where AI output writes a `KNOWN` row. Only
first-party user input, direct CRM sync, or explicit human verification
can set `KNOWN`.

**Conflicts are surfaced, not resolved by fiat.** If a 2019 note says
Michael is the decision maker and a 2026 finding suggests he's left the
company, both `KnowledgeItem` rows persist; the older one moves to
`SUPERSEDED` or `CONFLICTING` verification status (never deleted — see
`DATA_MODEL.md`), and the UI shows the tension rather than picking a
winner silently. Recommendation reasoning should reference the
conflict when relevant ("last known 2019, possibly outdated").

## Explainability — the "why is Scout telling me this" requirement

Every `Recommendation` and `AccountScore` must be traceable back to the
specific `KnowledgeItem` / `ResearchFinding` / `Signal` rows that
produced it (`evidence_refs`). A recommendation-generation call is not
allowed to return prose alone — it must return prose *plus* the
evidence reference list, and the two are validated for consistency
(every claim in the prose should correspond to at least one evidence
ref; a reasoning step that can't point to evidence doesn't get
surfaced as a recommendation, it gets logged as a lower-confidence
internal signal instead).

Example shape:

```typescript
interface RecommendationResult {
  headline: string;                 // "Call Jennifer Smith"
  reasoning: string;                // human-readable why
  evidenceRefs: EvidenceRef[];      // [{type: 'knowledge_item', id, excerpt}, ...]
  confidence: 'low' | 'medium' | 'high';
  conflictsNoted?: string[];
}
```

## Scoring — assisted, not opaque

AI may help *compute* a score component (e.g. classifying signal
strength) but the `AccountScore` a user sees is always the sum of
labeled `AccountScoreComponent` rows with their own evidence refs (see
`DATA_MODEL.md`). "AI Score: 87" with no explanation is explicitly
rejected — see `PRODUCT_CONSTITUTION.md` and the source brief's §17.
The exact scoring formula/weights are deferred to a post-architecture
decision (`DECISIONS.md`), but the *shape* — decomposable, evidence-
linked — is fixed now because it's much harder to retrofit than to
build in from the start.

## Cost discipline

Every `AIProvider` call is wrapped so token usage (where the provider
reports it) and a cost estimate are written to `UsageRecord` before the
caller sees the result — cost tracking is not optional instrumentation
bolted on later. See `COST_MODEL.md`.

## What Claude Design should take from this doc

The product must never expose raw model chain-of-thought, prompt
text, or "which model answered" to the end user — see
`PRODUCT_CONSTITUTION.md` §25, no AI-lab-experience. What the UI shows
is: the claim, its certainty tier, and its evidence — never the
mechanism that produced it.
