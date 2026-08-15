/**
 * Row <-> domain-type mapping for the local SQLite store. Raw sqlite
 * rows are snake_case with SQLite-native types (0/1 for booleans, JSON
 * stored as TEXT) — these functions are the one place that translates
 * between that and the camelCase src/types/product.ts shapes the
 * domain layer and UI already expect. See src/data/index.ts,
 * docs/LOCAL_MODE.md.
 */
import type {
  Account,
  AccountContactRelationship,
  AccountScore,
  CallOutcome,
  Contact,
  KnowledgeItem,
  PostCallNote,
  ResearchFinding,
  SellerStyleProfile,
  SellingSituation,
  TargetList,
  TargetListItem,
  AnalyticsEvent,
} from '@/types/product';

/** Every locally-stored row belongs to the single implicit local org — see src/auth/index.ts. */
export const LOCAL_ORG_ID = 'local';

function parseJson<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    name: row.name as string,
    normalizedName: row.normalized_name as string,
    primaryDomain: (row.primary_domain as string | null) ?? null,
    industry: (row.industry as string | null) ?? null,
    employeeCountRange: (row.employee_count_range as string | null) ?? null,
    address: parseJson(row.address as string | null, null),
    territoryId: (row.territory_id as string | null) ?? null,
    ownerMembershipId: (row.owner_membership_id as string | null) ?? null,
    relationshipStatus: row.relationship_status as Account['relationshipStatus'],
    status: row.status as Account['status'],
    researchStatus: row.research_status as Account['researchStatus'],
    identityStatus: row.identity_status as Account['identityStatus'],
    identityConfirmedAt: (row.identity_confirmed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    firstName: (row.first_name as string | null) ?? null,
    lastName: (row.last_name as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    linkedinUrl: (row.linkedin_url as string | null) ?? null,
    status: row.status as Contact['status'],
    lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
  };
}

export function mapAccountContactRelationship(row: Record<string, unknown>): AccountContactRelationship {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    contactId: row.contact_id as string,
    roleHypothesis: row.role_hypothesis as AccountContactRelationship['roleHypothesis'],
    certaintyType: row.certainty_type as AccountContactRelationship['certaintyType'],
    isCurrent: Boolean(row.is_current),
    validFrom: row.valid_from as string,
    validUntil: (row.valid_until as string | null) ?? null,
    sourceKnowledgeItemId: (row.source_knowledge_item_id as string | null) ?? null,
  };
}

export function mapKnowledgeItem(row: Record<string, unknown>): KnowledgeItem {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    contactId: (row.contact_id as string | null) ?? null,
    type: row.type as KnowledgeItem['type'],
    content: row.content as string,
    structuredValue: parseJson(row.structured_value as string | null, null),
    origin: row.origin as KnowledgeItem['origin'],
    sourceId: (row.source_id as string | null) ?? null,
    sourceReference: (row.source_reference as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    observedAt: (row.observed_at as string | null) ?? null,
    confidence: row.confidence as number,
    certaintyType: row.certainty_type as KnowledgeItem['certaintyType'],
    verificationStatus: row.verification_status as KnowledgeItem['verificationStatus'],
    createdAt: row.created_at as string,
  };
}

export function mapResearchFinding(row: Record<string, unknown>, sourceName: string): ResearchFinding {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    sourceId: (row.source_id as string | null) ?? null,
    sourceName,
    findingType: row.finding_type as string,
    content: row.content as string,
    url: (row.url as string | null) ?? null,
    retrievedAt: row.retrieved_at as string,
    relevantDate: (row.relevant_date as string | null) ?? null,
    confidence: row.confidence as number,
    certaintyType: row.certainty_type as ResearchFinding['certaintyType'],
  };
}

export function mapAccountScore(
  row: Record<string, unknown>,
  componentRows: Record<string, unknown>[]
): AccountScore {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    totalScore: row.total_score as number,
    computedAt: row.computed_at as string,
    components: componentRows.map((c) => ({
      componentType: c.component_type as AccountScore['components'][number]['componentType'],
      points: c.points as number,
      maxPoints: c.max_points as number,
      evidenceRefs: parseJson(c.evidence_refs as string | null, []),
    })),
  };
}

export function mapTargetList(row: Record<string, unknown>): TargetList {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    ownerMembershipId: (row.owner_membership_id as string | null) ?? null,
    researchFocus: (row.research_focus as string | null) ?? null,
    vertical: (row.vertical as string | null) ?? null,
    geography: (row.geography as string | null) ?? null,
    status: row.status as TargetList['status'],
    createdAt: row.created_at as string,
    lastWorkedAt: (row.last_worked_at as string | null) ?? null,
  };
}

export function mapTargetListItem(row: Record<string, unknown>): TargetListItem {
  return {
    id: row.id as string,
    targetListId: row.target_list_id as string,
    accountId: row.account_id as string,
    status: row.status as TargetListItem['status'],
    pinned: Boolean(row.pinned),
    workedAt: (row.worked_at as string | null) ?? null,
    addedAt: row.added_at as string,
  };
}

export function mapCallOutcome(row: Record<string, unknown>): CallOutcome {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    targetListItemId: (row.target_list_item_id as string | null) ?? null,
    contactId: (row.contact_id as string | null) ?? null,
    membershipId: row.membership_id as string,
    outcomeType: row.outcome_type as CallOutcome['outcomeType'],
    contactRoleObserved: (row.contact_role_observed as string | null) ?? null,
    occurredAt: row.occurred_at as string,
  };
}

export function mapPostCallNote(row: Record<string, unknown>): PostCallNote {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    callOutcomeId: row.call_outcome_id as string,
    membershipId: row.membership_id as string,
    rawInput: row.raw_input as string,
    cleanNote: (row.clean_note as string | null) ?? null,
    proposedAccountUpdates: parseJson(row.proposed_account_updates as string | null, []),
    followUpEmailDraft: (row.follow_up_email_draft as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    crmWriteStatus: row.crm_write_status as PostCallNote['crmWriteStatus'],
  };
}

export function mapSellingSituation(row: Record<string, unknown>): SellingSituation {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    accountId: row.account_id as string,
    definitionId: row.definition_id as string,
    createdFromCallOutcomeId: (row.created_from_call_outcome_id as string | null) ?? null,
    createdAt: row.created_at as string,
    notes: (row.notes as string | null) ?? null,
  };
}

export function mapSellerStyleProfile(row: Record<string, unknown>): SellerStyleProfile {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    membershipId: row.membership_id as string,
    sampleScripts: parseJson(row.sample_scripts as string, []),
    sampleEmails: parseJson(row.sample_emails as string, []),
    sampleVoicemails: parseJson(row.sample_voicemails as string, []),
    toneNotes: (row.tone_notes as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

export function mapAnalyticsEvent(row: Record<string, unknown>): AnalyticsEvent {
  return {
    id: row.id as string,
    organizationId: LOCAL_ORG_ID,
    eventType: row.event_type as AnalyticsEvent['eventType'],
    accountId: (row.account_id as string | null) ?? null,
    targetListId: (row.target_list_id as string | null) ?? null,
    contactId: (row.contact_id as string | null) ?? null,
    membershipId: (row.membership_id as string | null) ?? null,
    occurredAt: row.occurred_at as string,
  };
}
