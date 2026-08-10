/**
 * Observability model — the shapes for operational telemetry across AION.
 *
 * Every meaningful operation (a CRM sync, a webhook, a booking, an AI call, an
 * outbound message, a workflow step) emits an `OpsEvent` with a status and a
 * retry count. The recorder keeps a rolling window; `computeSystemHealth` rolls
 * those events up into a simple per-component 🟢/🟡/🔴 board. This is how we
 * know when something breaks before real leads flow through the system.
 */

/** The eight subsystems shown on the AION System Health board. */
export const OPS_COMPONENTS = [
  'ghl',
  'airtable',
  'scorecard',
  'workflows',
  'booking',
  'ai',
  'analytics',
  'compliance',
] as const;
export type OpsComponent = (typeof OPS_COMPONENTS)[number];

export const COMPONENT_LABEL: Record<OpsComponent, string> = {
  ghl: 'GHL',
  airtable: 'Airtable',
  scorecard: 'Scorecard',
  workflows: 'Workflows',
  booking: 'Booking',
  ai: 'AI',
  analytics: 'Analytics',
  compliance: 'Compliance',
};

/** The kind of operation an event describes. */
export type OpsEventType =
  | 'crm_sync'
  | 'webhook'
  | 'booking_event'
  | 'ai_call'
  | 'outbound_message'
  | 'workflow_execution'
  | 'scorecard_submission'
  | 'analytics_compute'
  | 'compliance_check'
  | 'health_check';

/**
 * Event outcome:
 *  - success:     completed cleanly
 *  - retry:       failed but will be retried (carries retryCount)
 *  - failure:     failed after exhausting retries (recoverable error state)
 *  - dead_letter: permanently failed, parked for manual intervention
 *  - suppressed:  intentionally NOT performed (e.g. outbound blocked in demo)
 */
export type OpsEventStatus = 'success' | 'retry' | 'failure' | 'dead_letter' | 'suppressed';

export interface OpsEvent {
  id: string;
  at: string;
  component: OpsComponent;
  type: OpsEventType;
  status: OpsEventStatus;
  /** Number of attempts made (1 = first try). */
  retryCount: number;
  /** Short human-readable summary of what happened. */
  message?: string;
  /** Error detail when the status is retry/failure/dead_letter. */
  error?: string;
  /** Correlates related events (e.g. retries of the same operation). */
  correlationId?: string;
  /** Non-sensitive extra context. */
  meta?: Record<string, unknown>;
}

/** Input to record an event (id/at are filled in by the recorder). */
export type OpsEventInput = Omit<OpsEvent, 'id' | 'at'> & { at?: string };

export type HealthLevel = 'operational' | 'degraded' | 'down' | 'unknown';

export interface ComponentHealth {
  component: OpsComponent;
  label: string;
  level: HealthLevel;
  /** Traffic-light emoji for quick scanning. */
  light: string;
  detail: string;
  stats: {
    total: number;
    success: number;
    failure: number;
    retrying: number;
    deadLetter: number;
    suppressed: number;
    /** Sum of retry attempts beyond the first, across events. */
    retryCount: number;
  };
  lastError?: { message: string; at: string };
  lastEventAt?: string;
}

export interface SystemHealth {
  level: HealthLevel;
  light: string;
  components: ComponentHealth[];
  generatedAt: string;
  /** Total events in the current window. */
  eventCount: number;
}

export const LEVEL_LIGHT: Record<HealthLevel, string> = {
  operational: '🟢',
  degraded: '🟡',
  down: '🔴',
  unknown: '⚪',
};
