/**
 * In-memory ops-event recorder — a process-local rolling window. Demo-safe (no
 * persistence, no external calls). In production this sink is swapped for a
 * durable store / log pipeline without changing call sites, exactly like the
 * structured logger.
 */
import type { OpsComponent, OpsEvent, OpsEventInput } from './types.js';

const MAX_EVENTS = 500;

export class OpsRecorder {
  private events: OpsEvent[] = [];
  private seq = 0;

  record(input: OpsEventInput): OpsEvent {
    const event: OpsEvent = {
      id: `ops_${Date.now().toString(36)}_${(this.seq++).toString(36)}`,
      at: input.at ?? new Date().toISOString(),
      component: input.component,
      type: input.type,
      status: input.status,
      retryCount: input.retryCount,
      message: input.message,
      error: input.error,
      correlationId: input.correlationId,
      meta: input.meta,
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
    return event;
  }

  /** All events, newest first. Optionally filtered by component. */
  list(filter?: { component?: OpsComponent; limit?: number }): OpsEvent[] {
    let out = [...this.events].reverse();
    if (filter?.component) out = out.filter((e) => e.component === filter.component);
    if (filter?.limit != null) out = out.slice(0, filter.limit);
    return out;
  }

  all(): OpsEvent[] {
    return [...this.events];
  }

  count(): number {
    return this.events.length;
  }

  reset(): void {
    this.events = [];
    this.seq = 0;
  }
}
