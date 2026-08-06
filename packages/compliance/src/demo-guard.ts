/**
 * Demo-mode guard. When DEMO_MODE is on, destructive or outbound production
 * actions (sending real messages, deleting records, charging cards, submitting
 * carrier applications) must be blocked so a sales demo can never touch the
 * real world. API handlers call `assertActionAllowed` before such actions.
 */
import { demoBlocked } from '@aion/shared';

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

export function isDestructive(action: string): action is GuardedAction {
  return (DESTRUCTIVE_ACTIONS as readonly string[]).includes(action);
}

export function assertActionAllowed(action: string, demoMode: boolean): void {
  if (demoMode && isDestructive(action)) {
    throw demoBlocked(action);
  }
}
