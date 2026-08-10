import { describe, expect, it } from 'vitest';
import type { Appointment, FunnelSnapshot, Lead, Opportunity, Policy } from '@aion/types';
import { compareFunnel, computeFunnel } from '../funnel.js';

let seq = 0;
const lead = (p: Partial<Lead> = {}): Lead => ({
  id: `l${seq++}`,
  organizationId: 'org',
  contactId: 'c',
  vertical: 'financial_advisor',
  status: 'new',
  qualificationStatus: 'qualified',
  score: 60,
  scoreBand: 'qualified',
  source: 'referral',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
  ...p,
});
const appt = (leadId: string, status: Appointment['status']): Appointment => ({
  id: `a${seq++}`,
  organizationId: 'org',
  leadId,
  title: 't',
  startsAt: '2026-07-02T00:00:00Z',
  endsAt: '2026-07-02T00:30:00Z',
  status,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
});
const opp = (leadId: string, status: Opportunity['status']): Opportunity => ({
  id: `o${seq++}`,
  organizationId: 'org',
  leadId,
  pipelineId: 'p',
  stageId: 's',
  name: 'n',
  monetaryValue: 1000,
  status,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
});
const policy = (leadId: string, status: Policy['status'], premium: number): Policy =>
  ({ id: `pol${seq++}`, organizationId: 'org', leadId, status, premium }) as Policy;

describe('computeFunnel — stage chain is monotonic', () => {
  // 4 leads; 3 qualified; 2 booked; 1 showed+opp+client.
  const leads = [
    lead({ id: 'L1', qualificationStatus: 'high_priority', status: 'client', source: 'referral' }),
    lead({ id: 'L2', qualificationStatus: 'qualified', status: 'working', source: 'webinar' }),
    lead({ id: 'L3', qualificationStatus: 'qualified', status: 'new', source: 'webinar' }),
    lead({ id: 'L4', qualificationStatus: 'nurture', status: 'nurturing', source: 'referral' }),
  ];
  const appointments = [appt('L1', 'completed'), appt('L2', 'scheduled'), appt('L4', 'cancelled')];
  const opportunities = [opp('L1', 'won'), opp('L2', 'open')];
  const policies = [policy('L1', 'active', 4200)];
  const campaigns = [
    { id: 'c1', name: 'Meta', channel: 'paid_social', spend: 1000, leadsGenerated: 3, visits: 300 },
    { id: 'c2', name: 'Referral', channel: 'referral', spend: 0, leadsGenerated: 1, visits: 4 },
  ];

  const r = computeFunnel({ leads, appointments, opportunities, policies, campaigns, responseTimeMinutes: 5 });
  const val = (k: string) => r.stages.find((s) => s.key === k)!.value;

  it('produces the 9 ordered stages', () => {
    expect(r.stages.map((s) => s.key)).toEqual([
      'traffic', 'leads', 'qualified', 'appointments', 'showed',
      'consultations', 'opportunities', 'clients', 'verifiedRevenue',
    ]);
  });

  it('counts each stage correctly', () => {
    expect(val('traffic')).toBe(304);
    expect(val('leads')).toBe(4);
    expect(val('qualified')).toBe(3);
    expect(val('appointments')).toBe(2); // L1 completed + L2 scheduled (L4 cancelled excluded)
    expect(val('showed')).toBe(1); // only L1 completed
    expect(val('consultations')).toBe(1); // L1 showed + has opp
    expect(val('opportunities')).toBe(1); // L1 active/won
    expect(val('clients')).toBe(1); // L1 client + active policy
    expect(val('verifiedRevenue')).toBe(4200);
  });

  it('each countable stage ⊆ the previous (monotonic funnel)', () => {
    const countable = r.stages.filter((s) => s.key !== 'traffic' && s.key !== 'verifiedRevenue');
    for (let i = 1; i < countable.length; i++) {
      expect(countable[i]!.value).toBeLessThanOrEqual(countable[i - 1]!.value);
    }
  });

  it('computes the named conversion rates', () => {
    expect(r.conversions.leadToQualified).toBeCloseTo(0.75, 4);
    expect(r.conversions.qualifiedToBooked).toBeCloseTo(2 / 3, 4);
    expect(r.conversions.bookedToShow).toBeCloseTo(0.5, 4);
    expect(r.conversions.leadToClient).toBeCloseTo(0.25, 4);
  });

  it('computes cost per lead and per qualified lead', () => {
    expect(r.totalSpend).toBe(1000);
    expect(r.costPerLead).toBe(250); // 1000 / 4
    expect(r.costPerQualifiedLead).toBeCloseTo(333.33, 2); // 1000 / 3
  });

  it('reports pipeline value (open opps) and verified revenue (issued policies)', () => {
    expect(r.pipelineValue).toBe(1000); // L2 open opp
    expect(r.verifiedRevenue).toBe(4200);
  });

  it('breaks down source and campaign conversion', () => {
    const referral = r.sources.find((s) => s.source === 'referral')!;
    expect(referral.leads).toBe(2);
    expect(referral.clients).toBe(1);
    const meta = r.campaigns.find((c) => c.name === 'Meta')!;
    expect(meta.visitToLead).toBeCloseTo(0.01, 4); // 3 / 300
    expect(meta.costPerLead).toBeCloseTo(333.33, 2);
  });
});

describe('compareFunnel — BEFORE vs AFTER', () => {
  const baseline: FunnelSnapshot = {
    periodLabel: 'before',
    traffic: 300, leads: 24, qualified: 9, appointments: 4, showed: 2,
    consultations: 1, opportunities: 1, clients: 0, verifiedRevenue: 0,
    spend: 8100, responseTimeMinutes: 240,
  };
  const pilot: FunnelSnapshot = {
    periodLabel: 'after',
    traffic: 421, leads: 33, qualified: 22, appointments: 11, showed: 3,
    consultations: 3, opportunities: 3, clients: 1, verifiedRevenue: 710,
    spend: 8100, responseTimeMinutes: 6,
  };
  const cmp = compareFunnel(baseline, pilot);

  it('computes per-stage delta and lift', () => {
    const leads = cmp.stages.find((s) => s.key === 'leads')!;
    expect(leads.before).toBe(24);
    expect(leads.after).toBe(33);
    expect(leads.delta).toBe(9);
    expect(leads.liftPct).toBeCloseTo(0.375, 4);
  });

  it('returns null lift when the baseline stage is zero (new)', () => {
    const clients = cmp.stages.find((s) => s.key === 'clients')!;
    expect(clients.liftPct).toBeNull();
    expect(clients.delta).toBe(1);
  });

  it('computes rate deltas in percentage points', () => {
    const l2q = cmp.rates.find((r) => r.key === 'leadToQualified')!;
    expect(l2q.before).toBeCloseTo(0.375, 4); // 9/24
    expect(l2q.after).toBeCloseTo(0.6667, 4); // 22/33
    expect(l2q.deltaPoints).toBeCloseTo(0.2917, 3);
  });

  it('surfaces the response-time improvement', () => {
    expect(cmp.responseTime).toEqual({ before: 240, after: 6 });
  });
});
