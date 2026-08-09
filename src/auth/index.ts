import { createServerSupabaseClient } from '@/db/client';
import type { AuthContext } from '@/types/tenancy';
import type { Action } from './permissions';
import { requirePermission } from './permissions';

export { can, requirePermission, PermissionDeniedError, ACTIONS } from './permissions';
export type { Action } from './permissions';

/**
 * Resolves the current request's Membership + Organization from the
 * authenticated Supabase session. Every server action / route handler
 * should call this rather than touching the Supabase client directly
 * — see docs/SECURITY.md §Authentication and eslint.config.mjs's
 * no-restricted-imports rule.
 *
 * NOT IMPLEMENTED YET — Phase 0 scaffold only. Real implementation
 * lands in Phase 1 once the memberships/organizations tables exist and
 * are migrated (supabase/migrations/0001_init_tenancy.sql).
 */
export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  throw new Error(
    'getCurrentAuthContext: membership/organization resolution not yet implemented — Phase 1. See docs/ROADMAP.md.'
  );
}

/** Throws if there's no authenticated context, or the role can't perform `action`. */
export async function requireAuth(action?: Action): Promise<AuthContext> {
  const ctx = await getCurrentAuthContext();
  if (!ctx) {
    throw new Error('Unauthenticated');
  }
  if (action) {
    requirePermission(ctx.membership.role, action);
  }
  return ctx;
}
