/**
 * Runtime-mode guard. Destructive or outbound production actions (sending real
 * messages, deleting records, charging cards, submitting carrier applications)
 * must be blocked unless the *resolved* runtime mode grants the matching
 * capability. In demo mode nothing outbound or destructive is permitted, so a
 * sales demo can never touch the real world; pilot/production permit them only
 * after the gated activation checks pass (see @aion/shared/mode).
 *
 * API handlers call `assertActionPermitted` before such actions. The older
 * `assertActionAllowed(action, demoMode)` remains for callers that already hold
 * a boolean, but new code should prefer the capability-aware entry point.
 */
import { demoBlocked, getCapabilities, type ModeCapabilities } from '@aion/shared';

/** Actions that are never permitted in demo mode. */
export const DESTRUCTIVE_ACTIONS = [
  'send_sms',
  'send_email',
  'place_call',
  'delete_lead',
  'delete_organization',
  'charge_payment',
  'submit_application',
  'push_to_ghl_production',
  'export_all_data',
] as const;

export type GuardedAction = (typeof DESTRUCTIVE_ACTIONS)[number];

/**
 * The capability each guarded action requires. Outbound communications need
 * `allowOutboundMessages`; everything else that mutates the real world needs
 * `allowProductionCrmWrites`. Both are false in demo mode.
 */
const ACTION_CAPABILITY: Record<GuardedAction, keyof ModeCapabilities> = {
  send_sms: 'allowOutboundMessages',
  send_email: 'allowOutboundMessages',
  place_call: 'allowOutboundMessages',
  delete_lead: 'allowProductionCrmWrites',
  delete_organization: 'allowProductionCrmWrites',
  charge_payment: 'allowProductionCrmWrites',
  submit_application: 'allowProductionCrmWrites',
  push_to_ghl_production: 'allowProductionCrmWrites',
  export_all_data: 'allowProductionCrmWrites',
};

export function isDestructive(action: string): action is GuardedAction {
  return (DESTRUCTIVE_ACTIONS as readonly string[]).includes(action);
}

/**
 * Capability-aware guard. Resolves the current runtime mode and blocks the
 * action when the capability it requires is not granted. This is the preferred
 * entry point — it blocks in demo and in any not-yet-activated pilot/production
 * configuration, since those resolve to demo capabilities.
 */
export function assertActionPermitted(action: string, source?: NodeJS.ProcessEnv): void {
  if (!isDestructive(action)) return;
  const caps = getCapabilities(source);
  if (!caps[ACTION_CAPABILITY[action]]) {
    throw demoBlocked(action);
  }
}

/**
 * Legacy boolean guard. Prefer `assertActionPermitted`. Retained for callers
 * that already resolved a demo boolean; blocks every destructive action when
 * `demoMode` is true.
 */
export function assertActionAllowed(action: string, demoMode: boolean): void {
  if (demoMode && isDestructive(action)) {
    throw demoBlocked(action);
  }
}
