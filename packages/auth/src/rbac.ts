/**
 * Role-based access control. This is the application-layer mirror of the SQL
 * role_permissions seed (infrastructure/migrations/0010_rbac_seed.sql) — keep
 * the two in sync. RLS is the hard tenant boundary; this map governs in-app
 * capability checks and UI affordances.
 */
import type { Permission, Role } from '@aion/types';
import { PERMISSIONS } from '@aion/types';
import { AppError } from '@aion/shared';

const ALL: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  organization_owner: ALL,
  agency_administrator: ALL,
  financial_advisor: [
    'org:view',
    'leads:view',
    'leads:update',
    'leads:assign',
    'opportunities:manage',
    'appointments:manage',
    'conversations:view',
    'conversations:send',
    'documents:view',
    'documents:request',
    'applications:manage',
    'analytics:view',
  ],
  insurance_agent: [
    'org:view',
    'leads:view',
    'leads:update',
    'leads:assign',
    'opportunities:manage',
    'appointments:manage',
    'conversations:view',
    'conversations:send',
    'documents:view',
    'documents:request',
    'applications:manage',
    'analytics:view',
  ],
  appointment_setter: [
    'org:view',
    'leads:view',
    'leads:create',
    'leads:update',
    'appointments:manage',
    'conversations:view',
    'conversations:send',
  ],
  sales_manager: [
    'org:view',
    'leads:view',
    'leads:assign',
    'pipelines:manage',
    'opportunities:manage',
    'appointments:manage',
    'workflows:manage',
    'campaigns:manage',
    'analytics:view',
  ],
  compliance_reviewer: [
    'org:view',
    'leads:view',
    'conversations:view',
    'documents:view',
    'compliance:review',
    'analytics:view',
  ],
  client_success_representative: [
    'org:view',
    'leads:view',
    'leads:update',
    'appointments:manage',
    'conversations:view',
    'conversations:send',
    'documents:view',
    'analytics:view',
  ],
  read_only_analyst: ['org:view', 'leads:view', 'analytics:view'],
};

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

/** Throws a 403 AppError when the role lacks the permission. */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AppError('forbidden', `Role "${role}" lacks permission "${permission}"`);
  }
}
