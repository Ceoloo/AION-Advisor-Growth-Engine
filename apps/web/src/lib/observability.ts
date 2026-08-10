/**
 * Process-local observability singleton for the web app. A single OpsRecorder
 * instance collects operational telemetry across requests; on first use it is
 * seeded with representative demo events so the System Health board is alive.
 *
 * `recordOps` also mirrors the event into the structured logger, so every
 * operational event is both queryable (health board) and in the log stream.
 */
import { logger } from '@aion/shared';
import { OpsRecorder, seedDemoOps, type OpsEventInput } from '@aion/observability';

const g = globalThis as unknown as { __aionOps?: OpsRecorder };

function getRecorder(): OpsRecorder {
  if (!g.__aionOps) {
    const recorder = new OpsRecorder();
    seedDemoOps(recorder);
    g.__aionOps = recorder;
  }
  return g.__aionOps;
}

export function opsRecorder(): OpsRecorder {
  return getRecorder();
}

/** Record an operational event and mirror it to the structured log. */
export function recordOps(input: OpsEventInput): void {
  const event = getRecorder().record(input);
  const log = logger.child({ component: `ops:${event.component}`, correlationId: event.correlationId });
  const meta = { type: event.type, status: event.status, retryCount: event.retryCount, error: event.error };
  if (event.status === 'failure' || event.status === 'dead_letter') log.error(event.message ?? event.type, meta);
  else if (event.status === 'retry') log.warn(event.message ?? event.type, meta);
  else log.info(event.message ?? event.type, meta);
}
