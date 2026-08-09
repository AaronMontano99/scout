# src/integrations

Layer 5 — concrete vendor adapters implementing the interfaces defined
in `src/services/` (`CRMProvider`, `EnrichmentProvider`,
`ResearchProvider`) and `src/ai/provider.ts` (`AIProvider`). One
subdirectory per vendor once built, e.g. `src/integrations/hubspot/`.

Empty in Phase 0 — see `docs/INTEGRATIONS.md`. The CSV/XLSX
`ImportProvider` is the exception and is expected here first, in
Phase 2.
