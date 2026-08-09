import { describe, expect, it } from 'vitest';
import { can, requirePermission, PermissionDeniedError } from '@/auth/permissions';

// Highest-risk logic per docs/ARCHITECTURE.md §Testing: permissions is
// the first thing that gets a real test, before any product code exists.

describe('permissions matrix', () => {
  it('OWNER can manage billing', () => {
    expect(can('OWNER', 'organization:manage_billing')).toBe(true);
  });

  it('ADMIN cannot manage billing', () => {
    expect(can('ADMIN', 'organization:manage_billing')).toBe(false);
  });

  it('REP cannot view team daily plans', () => {
    expect(can('REP', 'daily_plan:view_team')).toBe(false);
  });

  it('MANAGER can view team daily plans', () => {
    expect(can('MANAGER', 'daily_plan:view_team')).toBe(true);
  });

  it('every role can view accounts', () => {
    for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'REP'] as const) {
      expect(can(role, 'account:view')).toBe(true);
    }
  });

  it('requirePermission throws PermissionDeniedError for a disallowed action', () => {
    expect(() => requirePermission('REP', 'account:delete')).toThrow(
      PermissionDeniedError
    );
  });

  it('requirePermission does not throw for an allowed action', () => {
    expect(() => requirePermission('REP', 'account:view')).not.toThrow();
  });
});
