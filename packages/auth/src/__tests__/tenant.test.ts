import { describe, expect, it } from 'vitest';
import { assertSameTenant, scopeToTenant } from '../tenant.js';
import { hasPermission, requirePermission } from '../rbac.js';

describe('tenant isolation helpers', () => {
  const ctx = { organizationId: 'org_a' };

  it('rejects a record from another organization', () => {
    expect(() => assertSameTenant(ctx, { organizationId: 'org_b' })).toThrow(
      /does not belong to the active organization/,
    );
  });

  it('accepts a record from the same organization', () => {
    expect(() => assertSameTenant(ctx, { organizationId: 'org_a' })).not.toThrow();
  });

  it('scopeToTenant strips foreign records', () => {
    const rows = [
      { organizationId: 'org_a', id: 1 },
      { organizationId: 'org_b', id: 2 },
    ];
    expect(scopeToTenant(ctx, rows)).toEqual([{ organizationId: 'org_a', id: 1 }]);
  });
});

describe('rbac', () => {
  it('analyst is read-only', () => {
    expect(hasPermission('read_only_analyst', 'analytics:view')).toBe(true);
    expect(hasPermission('read_only_analyst', 'leads:delete')).toBe(false);
    expect(() => requirePermission('read_only_analyst', 'leads:delete')).toThrow(/lacks permission/);
  });
  it('owner can do everything', () => {
    expect(hasPermission('organization_owner', 'settings:manage')).toBe(true);
  });
});
