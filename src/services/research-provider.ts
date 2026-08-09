import type {
  CompanyIdentifier,
  RawEvidence,
  EvidenceReference,
  SalesProfileContext,
} from '@/types/evidence';

/**
 * General web/news/signal research — see docs/RESEARCH_ARCHITECTURE.md.
 * Explicitly NOT a LinkedIn scraper and never will be — see
 * docs/PRODUCT_CONSTITUTION.md and docs/INTEGRATIONS.md. LinkedIn is
 * only ever a future *approved-API* integration, if one becomes
 * available for this use case.
 */
export interface ResearchProvider {
  searchCompany(input: CompanyIdentifier): Promise<RawEvidence[]>;
  /** Evidence specifically evaluated against what this seller cares about. */
  findSignals(
    input: CompanyIdentifier,
    salesProfile: SalesProfileContext
  ): Promise<RawEvidence[]>;
  retrieveEvidence(ref: EvidenceReference): Promise<RawEvidence>;
}
