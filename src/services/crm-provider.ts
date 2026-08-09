/**
 * See docs/RESEARCH_ARCHITECTURE.md and docs/INTEGRATIONS.md. No CRM
 * vendor (HubSpot, Salesforce, Pipedrive, Zoho, ...) is implemented in
 * Phase 0 — this interface exists so Phase 7 integrations are "write
 * an adapter," not "redesign the domain layer." Not built in V1 — see
 * docs/ROADMAP.md, Phase 7.
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
