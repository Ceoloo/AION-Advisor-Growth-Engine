/**
 * Declarative workflow model. Definitions are plain data (serializable to
 * JSON/YAML) so they can later be authored in a visual builder. The engine
 * executes registered step handlers; definitions never contain code.
 */

export type TriggerType =
  | 'lead.created'
  | 'appointment.booked'
  | 'appointment.completed'
  | 'appointment.missed'
  | 'renewal.approaching'
  | 'client.milestone'
  | 'scorecard.completed';

export interface WorkflowStep {
  /** Stable id used for logging and resumability. */
  id: string;
  /** Handler key resolved against the engine's step registry. */
  action: string;
  /** Human-readable label. */
  label: string;
  /** Optional static config passed to the handler. */
  config?: Record<string, unknown>;
  /** If true, the step requires human approval before running (compliance). */
  requiresApproval?: boolean;
  /** Retry policy for transient failures. */
  retry?: { maxAttempts: number; backoffMs: number };
}

export interface WorkflowDefinition {
  key: string;
  name: string;
  description: string;
  trigger: TriggerType;
  steps: WorkflowStep[];
}

/** Mutable context threaded through a workflow run. */
export interface WorkflowContext {
  organizationId: string;
  leadId?: string;
  correlationId: string;
  data: Record<string, unknown>;
  demoMode: boolean;
}

export type StepHandler = (
  ctx: WorkflowContext,
  step: WorkflowStep,
) => Promise<void | Record<string, unknown>>;

export interface StepResult {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped' | 'awaiting_approval';
  attempts: number;
  error?: string;
  output?: Record<string, unknown>;
}

export interface WorkflowRunResult {
  workflowKey: string;
  status: 'completed' | 'failed' | 'partial';
  steps: StepResult[];
}
