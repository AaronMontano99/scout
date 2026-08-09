/**
 * Core tenancy types — see docs/DATA_MODEL.md for the full entity
 * design these are drawn from, and docs/SECURITY.md for how they're
 * used in authorization.
 */

export const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'REP'] as const;
export type Role = (typeof ROLES)[number];

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  status: 'active' | 'invited' | 'removed';
  territoryIds: string[]; // see docs/SECURITY.md — scope shape exists now, full enforcement is Phase 6
  createdAt: string;
}

/** The resolved identity every server action / route handler works from. */
export interface AuthContext {
  userId: string;
  membership: Membership;
  organization: Organization;
}
