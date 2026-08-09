/**
 * Shared evidence/result shapes used across provider interfaces so
 * normalization into ResearchFinding/KnowledgeItem rows (see
 * docs/DATA_MODEL.md) is a straight mapping, not a bespoke transform
 * per provider. See docs/RESEARCH_ARCHITECTURE.md.
 */

export type CertaintyType = 'KNOWN' | 'INFERRED' | 'SUGGESTED';

export interface CompanyIdentifier {
  name?: string;
  domain?: string;
  organizationId: string; // tenant scoping travels with every provider call
}

export interface PersonIdentifier {
  name?: string;
  email?: string;
  companyDomain?: string;
  organizationId: string;
}

export interface RawEvidence {
  sourceName: string;
  sourceUrl?: string;
  content: string;
  retrievedAt: string; // ISO date — when Scout found it
  relevantDate?: string; // ISO date — when the underlying event happened, if known
  confidence?: number; // 0-1, provider's own confidence if it reports one
}

export interface EvidenceReference {
  provider: string;
  externalId: string;
}

export interface CostEstimate {
  estimatedCostCents: number;
  currency: 'USD';
}

export interface SalesProfileContext {
  whatWeSell: string;
  icp: Record<string, unknown>;
  strategicPriorities: string[];
}
