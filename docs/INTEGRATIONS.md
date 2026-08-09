# Integrations

## Principle

Third-party vendors will change — get acquired, change pricing, get
replaced by a better option, go down. No vendor may become inseparable
from the application domain. Every integration is an adapter
implementing an interface defined in `RESEARCH_ARCHITECTURE.md`, living
in `src/integrations/<vendor>/`, and nowhere else.

## V1 integration: CSV / XLSX

The first and only V1 integration, and deliberately treated as a
first-class `ImportProvider` rather than a special case — this is what
proves the adapter pattern works before anything higher-stakes (a live
CRM sync) depends on it.

Flow: upload → parse (`ImportProvider.parse`) → column-mapping
suggestion (`ImportProvider.inferColumnMapping`, AI-assisted but
human-confirmed) → row-level validation → entity resolution per row →
`Account`/`Contact`/`KnowledgeItem` creation → import summary. See
`DATA_MODEL.md` §Import/ImportRow.

## Deferred integrations (architected for, not built in V1)

| Category | Examples | Interface |
|---|---|---|
| CRM | HubSpot, Salesforce, Pipedrive, Zoho, custom | `CRMProvider` |
| Enrichment | ZoomInfo, Apollo | `EnrichmentProvider` |
| Web research | general web/news search | `ResearchProvider` |
| Social (future, approved-API only) | LinkedIn, if/when an approved API path exists for this use case | `ResearchProvider` or a future `SocialProvider` |

**Do not build these during V1.** The point of the adapter interfaces
existing now is that adding one later is "implement this interface,"
not "figure out how research/scoring/knowledge ingestion should work."

## Explicitly disallowed, regardless of business pressure

- Unauthorized LinkedIn scraping.
- Automated browser scraping of any platform's UI to route around a
  missing official API.
- Connection automation or messaging automation on any social platform.
- Any mechanism designed to bypass a platform's stated restrictions or
  rate limits.

If a desired integration has no official, approved API path, the
answer is "not yet," not "scrape it."

## Credential handling

`Integration.credentials_ref` (see `DATA_MODEL.md`) never stores a raw
secret in the primary application database. OAuth tokens/API keys live
in a secrets store (Supabase Vault or equivalent), referenced by ID.
Revoking an `Integration` invalidates the credential at the provider
where the provider's API supports it, and always stops the app from
using it regardless.

## Adapter contract discipline

Every provider adapter:

- Normalizes its vendor-specific response shape into the shared
  `RawEvidence` / `RawCRMAccount` / `EnrichmentResult` types defined in
  `src/types`, before that data touches domain code.
- Reports cost/usage for every call (even "free tier" calls count
  against `UsageRecord` so usage patterns are visible before a bill
  arrives).
- Fails loudly and specifically (rate-limited vs. auth-expired vs.
  not-found are different failure modes with different retry
  behavior) rather than collapsing everything into a generic error.
