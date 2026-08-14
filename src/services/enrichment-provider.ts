import type { CompanyIdentifier, PersonIdentifier, CostEstimate } from '@/types/evidence';

/**
 * See docs/RESEARCH_ARCHITECTURE.md and docs/INTEGRATIONS.md. No
 * enrichment vendor (ZoomInfo, Apollo, ...) is implemented in Phase 0.
 * No single enrichment vendor may become load-bearing — this interface
 * is what makes that a real constraint rather than a hope.
 *
 * Unused in local-first mode (docs/LOCAL_MODE.md) — kept as an adapter
 * contract for anyone who wants to wire in their own API key later.
 */

export interface EnrichmentResult<T> {
  data: T;
  sourceName: string;
  retrievedAt: string;
  costCents: number;
}

export interface CompanyEnrichment {
  name: string;
  domain?: string;
  industry?: string;
  employeeCountRange?: string;
  address?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export interface PersonEnrichment {
  fullName: string;
  title?: string;
  email?: string;
  companyDomain?: string;
  raw: Record<string, unknown>;
}

export interface EnrichmentProvider {
  enrichCompany(input: CompanyIdentifier): Promise<EnrichmentResult<CompanyEnrichment>>;
  enrichPerson(input: PersonIdentifier): Promise<EnrichmentResult<PersonEnrichment>>;
  /** Always call before enrichCompany/enrichPerson when cost matters — see docs/COST_MODEL.md. */
  estimateCost(input: CompanyIdentifier | PersonIdentifier): Promise<CostEstimate>;
}
