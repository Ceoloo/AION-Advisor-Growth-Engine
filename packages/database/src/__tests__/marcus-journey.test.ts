import { describe, expect, it } from 'vitest';
import { DemoStore } from '../demo/store.js';
import { MARCUS_LEAD_ID, MARCUS_TAGS } from '../demo/seed.js';

/**
 * Guards the scripted Ben Peretz pilot presentation. If any of these fail, the
 * demo narrative (deterministic 80–88 high-priority score, appointment-ready
 * Marcus Johnson) is broken.
 */
describe('Ben Peretz pilot — Marcus Johnson journey', () => {
  const store = new DemoStore(42);
  const org = store.org('org_ben-peretz')!;

  it('customizes the demo organization to Ben Peretz', () => {
    expect(org.organization.name).toBe('Ben Peretz — Financial Protection & Planning');
    expect(org.profiles[0]!.fullName).toBe('Ben Peretz');
  });

  it('includes Marcus Johnson as a lead assigned to Ben', () => {
    const detail = store.getLeadDetail('org_ben-peretz', MARCUS_LEAD_ID)!;
    expect(detail).not.toBeNull();
    expect(detail.contact!.firstName).toBe('Marcus');
    expect(detail.contact!.lastName).toBe('Johnson');
    expect(detail.advisor!.fullName).toBe('Ben Peretz');
  });

  it('produces a deterministic score in the 80–88 high-priority band', () => {
    const marcus = org.leads.find((l) => l.id === MARCUS_LEAD_ID)!;
    expect(marcus.score).toBeGreaterThanOrEqual(80);
    expect(marcus.score).toBeLessThanOrEqual(88);
    expect(marcus.scoreBand).toBe('high_priority');
    expect(marcus.qualificationStatus).toBe('high_priority');
    // Reproducible across store instances.
    const again = new DemoStore(42).org('org_ben-peretz')!.leads.find((l) => l.id === MARCUS_LEAD_ID)!;
    expect(again.score).toBe(marcus.score);
  });

  it('captured consent, an appointment, and a completed qualification', () => {
    const detail = store.getLeadDetail('org_ben-peretz', MARCUS_LEAD_ID)!;
    expect(detail.consents.every((c) => c.status === 'granted')).toBe(true);
    expect(detail.consents.map((c) => c.type).sort()).toEqual(['call', 'email', 'sms']);
    expect(detail.appointments[0]!.status).toBe('scheduled');
    expect(detail.qualification!.result!.appointmentReady).toBe(true);
  });

  it('exposes the expected tags for the journey', () => {
    expect(MARCUS_TAGS).toContain('High Priority');
    expect(MARCUS_TAGS).toContain('Appointment Ready');
  });

  it('stays tenant-isolated — Marcus is not visible to the second tenant', () => {
    expect(store.getLead('org_second-tenant', MARCUS_LEAD_ID)).toBeNull();
  });
});
