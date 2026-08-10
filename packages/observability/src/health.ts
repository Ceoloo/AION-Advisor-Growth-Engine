/**
 * Health aggregation. Rolls a window of ops events into a per-component
 * 🟢/🟡/🔴 status and an overall system level.
 *
 * Rules (deterministic, worst-wins):
 *  - any dead-letter in the window       → down     🔴
 *  - the most recent event is a failure  → degraded 🟡
 *  - failures earlier but latest is OK    → operational (recovered) 🟢
 *  - no events                            → the component's idle baseline
 *
 * `suppressed` (e.g. outbound blocked in demo) is informational, never a fault.
 */
import {
  COMPONENT_LABEL,
  LEVEL_LIGHT,
  OPS_COMPONENTS,
  type ComponentHealth,
  type HealthLevel,
  type OpsComponent,
  type OpsEvent,
  type SystemHealth,
} from './types.js';

export interface HealthContext {
  /** True when running on seeded demo data (components report their mock/simulated baseline). */
  demo?: boolean;
  /** Per-component override note (e.g. "simulated", "not configured"). */
  baselineDetail?: Partial<Record<OpsComponent, string>>;
}

const LEVEL_RANK: Record<HealthLevel, number> = { operational: 0, unknown: 1, degraded: 2, down: 3 };

function levelFor(events: OpsEvent[]): { level: HealthLevel; detail: string } {
  if (events.length === 0) return { level: 'operational', detail: 'No recent activity' };

  const deadLetter = events.filter((e) => e.status === 'dead_letter').length;
  if (deadLetter > 0) {
    return { level: 'down', detail: `${deadLetter} dead-letter event(s) need attention` };
  }

  // Events are provided newest-first for a component.
  const latest = events[0]!;
  if (latest.status === 'failure') {
    return { level: 'degraded', detail: latest.error ?? latest.message ?? 'Recent failure' };
  }
  if (latest.status === 'retry') {
    return { level: 'degraded', detail: `Retrying (attempt ${latest.retryCount})` };
  }

  const failures = events.filter((e) => e.status === 'failure').length;
  if (failures > 0) {
    return { level: 'operational', detail: `Recovered — ${failures} earlier failure(s)` };
  }
  return { level: 'operational', detail: 'All recent operations succeeded' };
}

function componentHealth(component: OpsComponent, all: OpsEvent[], ctx: HealthContext): ComponentHealth {
  // Newest-first for this component.
  const events = all
    .filter((e) => e.component === component)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const { level, detail } = levelFor(events);
  const stats = {
    total: events.length,
    success: events.filter((e) => e.status === 'success').length,
    failure: events.filter((e) => e.status === 'failure').length,
    retrying: events.filter((e) => e.status === 'retry').length,
    deadLetter: events.filter((e) => e.status === 'dead_letter').length,
    suppressed: events.filter((e) => e.status === 'suppressed').length,
    retryCount: events.reduce((s, e) => s + Math.max(0, e.retryCount - 1), 0),
  };
  const lastErrorEvent = events.find((e) => e.error);
  const baseDetail = events.length === 0 ? ctx.baselineDetail?.[component] : undefined;

  return {
    component,
    label: COMPONENT_LABEL[component],
    level,
    light: LEVEL_LIGHT[level],
    detail: baseDetail ?? detail,
    stats,
    lastError: lastErrorEvent ? { message: lastErrorEvent.error!, at: lastErrorEvent.at } : undefined,
    lastEventAt: events[0]?.at,
  };
}

/** Compute the full System Health board from a window of ops events. */
export function computeSystemHealth(events: OpsEvent[], ctx: HealthContext = {}): SystemHealth {
  const components = OPS_COMPONENTS.map((c) => componentHealth(c, events, ctx));
  const worst = components.reduce<HealthLevel>(
    (acc, c) => (LEVEL_RANK[c.level] > LEVEL_RANK[acc] ? c.level : acc),
    'operational',
  );
  return {
    level: worst,
    light: LEVEL_LIGHT[worst],
    components,
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
  };
}
