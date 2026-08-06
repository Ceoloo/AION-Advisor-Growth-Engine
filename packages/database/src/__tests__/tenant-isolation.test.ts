import { describe, expect, it } from 'vitest';
import { DemoStore } from '../demo/store.js';

describe('DemoStore tenant isolation', () => {
  const store = new DemoStore(42);
  const [orgA, orgB] = store.listOrganizations();

  it('seeds two distinct tenants', () => {
    expect(orgA).toBeDefined();
    expect(orgB).toBeDefined();
    expect(orgA!.id).not.toBe(orgB!.id);
  });

  it('meets the demo data minimums for the primary tenant', () => {
    const primary = store.org(orgA!.id)!;
    expect(primary.leads.length).toBeGreaterThanOrEqual(30);
    expect(primary.appointments.length).toBeGreaterThanOrEqual(10);
    expect(primary.applications.length).toBeGreaterThanOrEqual(6);
    expect(primary.policies.filter((p) => p.status === 'active').length).toBeGreaterThanOrEqual(4);
    expect(primary.campaigns.length).toBe(5);
    expect(primary.profiles.length).toBeGreaterThanOrEqual(3);
    expect(primary.timeline.length).toBeGreaterThanOrEqual(50);
    expect(primary.pipelines.length).toBe(2);
  });

  it('cannot read a lead belonging to another organization', () => {
    const primary = store.org(orgA!.id)!;
    const foreignLeadId = primary.leads[0]!.id;
    // Looking up org A's lead under org B's scope must return null.
    expect(store.getLead(orgB!.id, foreignLeadId)).toBeNull();
    // And correctly resolves under its own tenant.
    expect(store.getLead(orgA!.id, foreignLeadId)).not.toBeNull();
  });

  it('getLeadDetail is tenant-scoped', () => {
    const primary = store.org(orgA!.id)!;
    const leadId = primary.leads[0]!.id;
    expect(store.getLeadDetail(orgB!.id, leadId)).toBeNull();
    const detail = store.getLeadDetail(orgA!.id, leadId);
    expect(detail?.lead.id).toBe(leadId);
    expect(detail?.contact).not.toBeNull();
  });

  it('produces deterministic output for the same seed', () => {
    const a = new DemoStore(7).org('org_aion-demo');
    const b = new DemoStore(7).org('org_aion-demo');
    expect(a?.leads.length).toBe(b?.leads.length);
    expect(a?.leads[0]?.score).toBe(b?.leads[0]?.score);
  });
});
