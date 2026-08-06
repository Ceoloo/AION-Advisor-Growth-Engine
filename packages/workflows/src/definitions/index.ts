import type { WorkflowDefinition } from '../types.js';
import newLead from './new-lead.json';
import appointmentBooking from './appointment-booking.json';
import postAppointment from './post-appointment.json';
import noShow from './no-show.json';
import renewal from './renewal.json';
import referral from './referral.json';

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  newLead as WorkflowDefinition,
  appointmentBooking as WorkflowDefinition,
  postAppointment as WorkflowDefinition,
  noShow as WorkflowDefinition,
  renewal as WorkflowDefinition,
  referral as WorkflowDefinition,
];

export const WORKFLOWS_BY_KEY: Record<string, WorkflowDefinition> = Object.fromEntries(
  WORKFLOW_DEFINITIONS.map((w) => [w.key, w]),
);

export function getWorkflow(key: string): WorkflowDefinition | undefined {
  return WORKFLOWS_BY_KEY[key];
}
