import type { Role } from '@/types/tenancy';

/**
 * Centralized authorization matrix — see docs/SECURITY.md: "a single
 * source of truth for 'can this role do this action,' not scattered
 * `if (role === 'ADMIN')` checks across UI components."
 *
 * Add new actions here as domain features are built. Every mutating
 * server action must call can() server-side regardless of what the UI
 * already hid — UI hiding is a nicety, not the authorization mechanism.
 */
export const ACTIONS = [
  'organization:manage_billing',
  'organization:manage_members',
  'organization:manage_integrations',
  'account:view',
  'account:edit',
  'account:delete',
  'account:merge',
  'import:create',
  'import:review_match_candidates',
  'research:trigger',
  'daily_plan:view_own',
  'daily_plan:view_team',
] as const;
export type Action = (typeof ACTIONS)[number];

const ROLE_ACTIONS: Record<Role, ReadonlySet<Action>> = {
  OWNER: new Set(ACTIONS), // full access
  ADMIN: new Set(ACTIONS.filter((a) => a !== 'organization:manage_billing')),
  MANAGER: new Set([
    'account:view',
    'account:edit',
    'account:merge',
    'import:create',
    'import:review_match_candidates',
    'research:trigger',
    'daily_plan:view_own',
    'daily_plan:view_team',
  ]),
  REP: new Set([
    'account:view',
    'account:edit',
    'import:create',
    'research:trigger',
    'daily_plan:view_own',
  ]),
};

export function can(role: Role, action: Action): boolean {
  return ROLE_ACTIONS[role].has(action);
}

export function requirePermission(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new PermissionDeniedError(role, action);
  }
}

export class PermissionDeniedError extends Error {
  constructor(
    public readonly role: Role,
    public readonly action: Action
  ) {
    super(`Role ${role} is not permitted to perform ${action}`);
    this.name = 'PermissionDeniedError';
  }
}
