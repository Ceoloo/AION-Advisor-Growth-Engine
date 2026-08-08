import { describe, expect, it } from 'vitest';
import { listAdapters, INTEGRATION_REGISTRY } from '../registry.js';

describe('integration registry', () => {
  it('registers every documented provider', () => {
    expect(listAdapters().length).toBeGreaterThanOrEqual(20);
  });

  it('marks GoHighLevel as implemented and others as mocked', async () => {
    const ghl = INTEGRATION_REGISTRY.get('gohighlevel')!;
    expect(ghl.implemented).toBe(true);
    const twilio = INTEGRATION_REGISTRY.get('twilio')!;
    expect(twilio.implemented).toBe(false);
  });

  it('health checks return a consistent shape', async () => {
    const health = await INTEGRATION_REGISTRY.get('gohighlevel')!.healthCheck();
    expect(health.provider).toBe('gohighlevel');
    expect(health.status).toBe('connected');
    expect(typeof health.checkedAt).toBe('string');
  });
});
