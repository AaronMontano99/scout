import type { AuthContext } from '@/types/tenancy';
import type { Action } from './permissions';
import { requirePermission } from './permissions';

export { can, requirePermission, PermissionDeniedError, ACTIONS } from './permissions';
export type { Action } from './permissions';

/**
 * Local-first mode has exactly one user, running Scout on their own
 * machine against their own SQLite file — there's no session to
 * resolve, no sign-in flow, no other tenant to keep data separate
 * from. OWNER is correct here, not a default-to-permissive shortcut:
 * per permissions.ts's ROLE_ACTIONS, OWNER is "full access," which is
 * exactly what someone running their own local instance should have.
 * See docs/LOCAL_MODE.md.
 */
const LOCAL_AUTH_CONTEXT: AuthContext = {
  userId: 'local-user',
  membership: {
    id: 'local-membership',
    organizationId: 'local',
    userId: 'local-user',
    role: 'OWNER',
    status: 'active',
    territoryIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  organization: {
    id: 'local',
    name: 'My Workspace',
    slug: 'local',
    industry: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

export function getCurrentAuthContext(): AuthContext {
  return LOCAL_AUTH_CONTEXT;
}

/** Throws if the local user's role can't perform `action`. */
export function requireAuth(action?: Action): AuthContext {
  if (action) {
    requirePermission(LOCAL_AUTH_CONTEXT.membership.role, action);
  }
  return LOCAL_AUTH_CONTEXT;
}
