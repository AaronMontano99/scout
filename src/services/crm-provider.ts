/**
 * See docs/RESEARCH_ARCHITECTURE.md and docs/INTEGRATIONS.md. No CRM
 * vendor (HubSpot, Salesforce, Pipedrive, Zoho, ...) is implemented in
 * Phase 0 — this interface exists so Phase 7 integrations are "write
 * an adapter," not "redesign the domain layer." Not built in V1 — see
 * docs/ROADMAP.md, Phase 7.
 *
 * Unused in local-first mode (docs/LOCAL_MODE.md) — kept as an adapter
 * contract for anyone who wants to wire in a personal CRM export later.
 */

export interface RawCRMAccount {
  externalId: string;
  name: string;
  domain?: string;
  raw: Record<string, unknown>;
}

export interface RawCRMContact {
  externalId: string;
  accountExternalId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  raw: Record<string, unknown>;
}

export interface RawCRMNote {
  externalId: string;
  accountExternalId: string;
  contactExternalId?: string;
  content: string;
  authorName?: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export interface CRMUpdate {
  accountExternalId: string;
  fields: Record<string, unknown>;
}

export interface PushResult {
  succeeded: number;
  failed: number;
  errors: { accountExternalId: string; message: string }[];
}

export interface IntegrationConnection {
  integrationId: string;
  connectedAt: string;
}

export interface CRMProvider {
  connect(organizationId: string, authPayload: unknown): Promise<IntegrationConnection>;
  syncAccounts(organizationId: string, since?: Date): AsyncIterable<RawCRMAccount>;
  syncContacts(organizationId: string, since?: Date): AsyncIterable<RawCRMContact>;
  syncNotes(organizationId: string, since?: Date): AsyncIterable<RawCRMNote>;
  pushUpdates(organizationId: string, updates: CRMUpdate[]): Promise<PushResult>;
}

/**
 * Writeback capabilities — see docs/CRM_WRITEBACK.md. Deliberately a
 * *separate* interface from CRMProvider, not additional methods on it:
 * not every provider implementation supports every write capability
 * (a read-only integration is legitimate), and every write path
 * requires the human-approval gate described in POST_CALL_WORKFLOW.md
 * regardless of what the underlying vendor API technically allows.
 * Callers must check `supports()` before attempting a write — calling
 * an unsupported method should never be the way a provider signals
 * "I don't do that."
 */
export type CRMWriteCapability = 'pushNote' | 'pushContact' | 'pushOutcome' | 'pushActivity';

export interface CRMWriteCapabilities {
  supports(capability: CRMWriteCapability): boolean;
  pushNote(organizationId: string, input: { accountExternalId: string; content: string }): Promise<PushResult>;
  pushContact(organizationId: string, input: RawCRMContact): Promise<PushResult>;
  pushOutcome(
    organizationId: string,
    input: { accountExternalId: string; outcomeType: string; occurredAt: string }
  ): Promise<PushResult>;
  pushActivity(
    organizationId: string,
    input: { accountExternalId: string; summary: string; occurredAt: string }
  ): Promise<PushResult>;
}
