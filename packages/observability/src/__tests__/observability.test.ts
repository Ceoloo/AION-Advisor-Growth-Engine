import { describe, expect, it } from 'vitest';
import { OpsRecorder } from '../recorder.js';
import { computeSystemHealth } from '../health.js';
import { seedDemoOps } from '../seed.js';
import { OPS_COMPONENTS } from '../types.js';

describe('OpsRecorder', () => {
  it('records events and lists them newest-first', () => {
    const r = new OpsRecorder();
    r.record({ component: 'ai', type: 'ai_call', status: 'success', retryCount: 1, at: '2026-01-01T00:00:00Z' });
    r.record({ component: 'ghl', type: 'webhook', status: 'success', retryCount: 1, at: '2026-01-01T01:00:00Z' });
    const list = r.list();
    expect(list).toHaveLength(2);
    expect(list[0]!.component).toBe('ghl'); // newest first
    expect(list[0]!.id).not.toBe(list[1]!.id);
  });

  it('filters by component and resets', () => {
    const r = new OpsRecorder();
    r.record({ component: 'ai', type: 'ai_call', status: 'success', retryCount: 1 });
    r.record({ component: 'booking', type: 'booking_event', status: 'success', retryCount: 1 });
    expect(r.list({ component: 'ai' })).toHaveLength(1);
    r.reset();
    expect(r.count()).toBe(0);
  });
});

describe('computeSystemHealth', () => {
  it('reports all eight components, operational by default', () => {
    const health = computeSystemHealth([]);
    expect(health.components.map((c) => c.component).sort()).toEqual([...OPS_COMPONENTS].sort());
    expect(health.level).toBe('operational');
    expect(health.light).toBe('🟢');
  });

  it('the demo seed is fully green with a retry recorded', () => {
    const r = new OpsRecorder();
    seedDemoOps(r);
    const health = computeSystemHealth(r.all());
    expect(health.level).toBe('operational');
    for (const c of health.components) expect(c.level).toBe('operational');
    const airtable = health.components.find((c) => c.component === 'airtable')!;
    expect(airtable.stats.retryCount).toBeGreaterThanOrEqual(1); // recovered-on-retry
  });

  it('a dead-letter event takes a component (and the system) down', () => {
    const r = new OpsRecorder();
    r.record({ component: 'airtable', type: 'crm_sync', status: 'dead_letter', retryCount: 4, error: 'gave up' });
    const health = computeSystemHealth(r.all());
    expect(health.components.find((c) => c.component === 'airtable')!.level).toBe('down');
    expect(health.level).toBe('down');
    expect(health.light).toBe('🔴');
  });

  it('a most-recent failure degrades the component (yellow)', () => {
    const r = new OpsRecorder();
    r.record({ component: 'ghl', type: 'webhook', status: 'failure', retryCount: 3, error: 'bad signature', at: '2026-01-01T00:00:00Z' });
    const ghl = computeSystemHealth(r.all()).components.find((c) => c.component === 'ghl')!;
    expect(ghl.level).toBe('degraded');
    expect(ghl.light).toBe('🟡');
    expect(ghl.lastError?.message).toBe('bad signature');
  });

  it('a failure followed by a success reads as recovered (green)', () => {
    const r = new OpsRecorder();
    r.record({ component: 'ai', type: 'ai_call', status: 'failure', retryCount: 2, error: 'schema invalid', at: '2026-01-01T00:00:00Z' });
    r.record({ component: 'ai', type: 'ai_call', status: 'success', retryCount: 3, at: '2026-01-01T00:05:00Z' });
    const ai = computeSystemHealth(r.all()).components.find((c) => c.component === 'ai')!;
    expect(ai.level).toBe('operational');
    expect(ai.detail).toMatch(/Recovered/);
  });

  it('suppressed (demo outbound) is not a fault', () => {
    const r = new OpsRecorder();
    r.record({ component: 'ghl', type: 'outbound_message', status: 'suppressed', retryCount: 0 });
    const ghl = computeSystemHealth(r.all()).components.find((c) => c.component === 'ghl')!;
    expect(ghl.level).toBe('operational');
    expect(ghl.stats.suppressed).toBe(1);
  });
});
