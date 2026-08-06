export * from './enums.js';
export * from './entities.js';

/** Result envelope used by services and API handlers for typed error flow. */
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; details?: unknown };

/** Standard tenant context resolved on every authenticated request. */
export interface TenantContext {
  organizationId: string;
  profileId: string;
  role: import('./enums.js').Role;
  isDemo: boolean;
  correlationId: string;
}
