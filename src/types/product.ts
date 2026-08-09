/**
 * Core product types, mirroring supabase/migrations/0002_core_product.sql
 * and docs/DATA_MODEL.md. Once a real Supabase project exists, prefer
 * generated types (src/db/types.ts) for anything that touches the DB
 * directly — these hand-written types are the source of truth for
 * domain logic and demo-mode fixtures in the meantime.
 */
import type { CertaintyType } from './evidence';

export type AccountRelationshipStatus =
  | 'prospect'
  | 'current_customer'
  | 'former_customer'
  | 'partner'
  | 'unknown';

// See docs/RESEARCH_ENGINE.md and src/domain/research-status.ts — the
// coarse, user-facing state. Deliberately distinct from any internal
// ResearchRun job status (DATA_MODEL.md Phase 3 Additions, ADR-0008).
export type AccountResearchStatus =
  | 'queued'
  | 'identifying'
  | 'researching'
  | 'processing'
  | 'ready'
  | 'limited_data'
  | 'needs_review'
  | 'failed'
  | 'refreshing';

// See docs/ENTITY_RESOLUTION.md — user-facing identity confidence,
// distinct from the internal MatchResult verdict in entity-resolution.ts.
export type AccountIdentityStatus =
  | 'unconfirmed'
  | 'confirmed'
  | 'likely_match'
  | 'lower_confidence'
  | 'review_recommended';

export interface Account {
  id: string;
  organizationId: string;
  name: string;
  normalizedName: string;
  primaryDomain: string | null;
  industry: string | null;
  employeeCountRange: string | null;
  address: Record<string, unknown> | null;
  territoryId: string | null;
  ownerMembershipId: string | null;
  relationshipStatus: AccountRelationshipStatus;
  status: 'active' | 'inactive' | 'merged';
  researchStatus: AccountResearchStatus;
  identityStatus: AccountIdentityStatus;
  identityConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BuyingRole =
  | 'decision_maker'
  | 'economic_buyer'
  | 'champion'
  | 'influencer'
  | 'technical_buyer'
  | 'blocker'
  | 'unknown';

export interface Contact {
  id: string;
  organizationId: string;
  accountId: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  status: 'active' | 'departed' | 'unknown';
  // People change jobs — decays independently of any specific fact
  // about them. See docs/RESEARCH_FRESHNESS.md.
  lastVerifiedAt: string | null;
}

// See docs/SOURCE_MODEL.md's 5-tier hierarchy and
// src/domain/source-quality.ts.
export type SourceTier = 1 | 2 | 3 | 4 | 5;

export interface Source {
  id: string;
  organizationId: string;
  type: 'user' | 'import' | 'crm' | 'enrichment' | 'web' | 'ai_inference';
  name: string;
  url: string | null;
  publisherDomain: string | null;
  title: string | null;
  sourceTier: SourceTier | null;
  extractionStatus: 'pending' | 'extracted' | 'failed' | 'skipped';
  contentHash: string | null;
}

export interface AccountContactRelationship {
  id: string;
  accountId: string;
  contactId: string;
  roleHypothesis: BuyingRole;
  certaintyType: CertaintyType;
  isCurrent: boolean;
  // See docs/EVIDENCE_MODEL.md's conflict-resolution model (product
  // spec §36) — a superseded relationship keeps validUntil set rather
  // than being deleted.
  validFrom: string;
  validUntil: string | null;
  sourceKnowledgeItemId: string | null;
}

export type KnowledgeItemType =
  | 'note'
  | 'call_note'
  | 'crm_activity'
  | 'meeting_observation'
  | 'decision_maker'
  | 'contract_timing'
  | 'incumbent_vendor'
  | 'relationship'
  | 'objection'
  | 'historical_event'
  | 'research_finding'
  | 'announcement'
  | 'inferred_observation';

export interface KnowledgeItem {
  id: string;
  organizationId: string;
  accountId: string;
  contactId: string | null;
  type: KnowledgeItemType;
  content: string;
  structuredValue: Record<string, unknown> | null;
  origin: 'user_entered' | 'imported' | 'crm_synced' | 'research_derived' | 'ai_inferred';
  sourceId: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  confidence: number;
  certaintyType: CertaintyType;
  verificationStatus: 'current' | 'stale' | 'superseded' | 'conflicting' | 'unverified';
  createdAt: string;
}

export interface ResearchFinding {
  id: string;
  organizationId: string;
  accountId: string;
  sourceId: string | null;
  sourceName: string;
  findingType: string;
  content: string;
  url: string | null;
  retrievedAt: string;
  relevantDate: string | null;
  confidence: number;
  certaintyType: CertaintyType;
}

export type PriorityLabel = 'strong_context' | 'useful_context' | 'limited_data' | 'lower_confidence';

export interface AccountScoreComponent {
  componentType:
    | 'icp_fit'
    | 'timing'
    | 'relationship'
    | 'signal_strength'
    | 'historical_context'
    | 'data_confidence'
    | 'strategic_priority';
  points: number;
  maxPoints: number;
  evidenceRefs: string[];
}

export interface AccountScore {
  id: string;
  accountId: string;
  totalScore: number;
  components: AccountScoreComponent[];
  computedAt: string;
}

// --- Target Lists (primary workspace object — see ADR-0006) -----------

export interface TargetList {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ownerMembershipId: string | null;
  researchFocus: string | null;
  vertical: string | null;
  geography: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  lastWorkedAt: string | null;
}

export type TargetListItemStatus = 'not_started' | 'in_progress' | 'worked' | 'skipped';

export interface TargetListItem {
  id: string;
  targetListId: string;
  accountId: string;
  status: TargetListItemStatus;
  pinned: boolean;
  workedAt: string | null;
  addedAt: string;
}

// --- Seller style (distinct memory category — see SELLER_STYLE.md) ----

export interface SellerStyleProfile {
  id: string;
  organizationId: string;
  membershipId: string;
  sampleScripts: string[];
  sampleEmails: string[];
  sampleVoicemails: string[];
  toneNotes: string | null;
  updatedAt: string;
}

// --- Call outcomes, selling situations, post-call notes ----------------

export type CallOutcomeType =
  | 'no_answer'
  | 'voicemail'
  | 'gatekeeper'
  | 'general_staff'
  | 'influencer'
  | 'champion'
  | 'decision_maker'
  | 'other_executive'
  | 'wrong_contact'
  | 'not_interested'
  | 'connected'
  | 'meeting_booked'
  | 'follow_up_required';

export interface CallOutcome {
  id: string;
  organizationId: string;
  accountId: string;
  targetListItemId: string | null;
  contactId: string | null;
  membershipId: string;
  outcomeType: CallOutcomeType;
  contactRoleObserved: string | null;
  occurredAt: string;
}

export interface SellingSituationDefinition {
  id: string;
  organizationId: string;
  name: string;
  criteria: string;
  isDefault: boolean;
}

export interface SellingSituation {
  id: string;
  organizationId: string;
  accountId: string;
  definitionId: string;
  createdFromCallOutcomeId: string | null;
  createdAt: string;
  notes: string | null;
}

export interface PostCallNote {
  id: string;
  organizationId: string;
  accountId: string;
  callOutcomeId: string;
  membershipId: string;
  rawInput: string;
  cleanNote: string | null;
  proposedAccountUpdates: ProposedAccountUpdate[];
  followUpEmailDraft: string | null;
  approvedAt: string | null;
  crmWriteStatus: 'not_applicable' | 'pending' | 'written' | 'failed';
}

export interface ProposedAccountUpdate {
  kind: 'knowledge_item' | 'contact_role';
  summary: string;
  // Always INFERRED or SUGGESTED pre-approval — see AI_ARCHITECTURE.md.
  // Approval promotes to KNOWN only when the rep explicitly confirms it
  // as first-party fact, not automatically.
  certaintyType: Extract<CertaintyType, 'INFERRED' | 'SUGGESTED'>;
}

// --- Analytics (event-sourced — see PROSPECTING_ANALYTICS.md) ---------

export type AnalyticsEventType =
  | 'call_attempted'
  | 'conversation'
  | 'target_conversation'
  | 'meeting_booked'
  | 'selling_situation_created'
  | 'opportunity_created'
  | 'email_drafted'
  | 'email_sent'
  | 'crm_note_created'
  | 'contact_added'
  | 'account_worked';

export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  eventType: AnalyticsEventType;
  accountId: string | null;
  targetListId: string | null;
  contactId: string | null;
  membershipId: string | null;
  occurredAt: string;
}
