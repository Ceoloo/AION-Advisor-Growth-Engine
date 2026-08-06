/**
 * Tenant-context helpers. Every authenticated request must resolve an active
 * organization and enforce that resources belong to it. The application layer
 * uses `assertSameTenant` as defense-in-depth alongside database RLS.
 */
import type { TenantContext } from '@aion/types';
import { tenantViolation } from '@aion/shared';

/** Guard that a fetched record belongs to the active organization. */
export function assertSameTenant(
  ctx: Pick<TenantContext, 'organizationId'>,
  record: { organizationId: string } | null | undefined,
): void {
  if (!record || record.organizationId !== ctx.organizationId) {
    throw tenantViolation();
  }
}

/** Filter a collection down to the active tenant (belt-and-suspenders). */
export function scopeToTenant<T extends { organizationId: string }>(
  ctx: Pick<TenantContext, 'organizationId'>,
  records: T[],
): T[] {
  return records.filter((r) => r.organizationId === ctx.organizationId);
}
