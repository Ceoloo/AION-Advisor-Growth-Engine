import { describe, expect, it } from 'vitest';
import { computeDashboardMetrics, estimateLeadValue } from '../metrics.js';
import type { Appointment, Application, Lead, Policy } from '@aion/types';

function lead(partial: Partial<Lead>): Lead {
  return {
    id: 'l1',
    organizationId: 'org',
    contactId: 'c1',
    vertical: 'financial_advisor',
    status: 'new',
    qualificationStatus: 'qualified',
    score: 60,
    scoreBand: 'qualified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe('computeDashboardMetrics', () => {
  const now = new Date('2026-08-06T00:00:00Z');

  it('computes core counts and rates', () => {
    const leads = [
      lead({ id: 'a', qualificationStatus: 'qualified', createdAt: now.toISOString() }),
      lead({ id: 'b', qualificationStatus: 'high_priority', createdAt: now.toISOString() }),
      lead({ id: 'c', qualificationStatus: 'nurture', status: 'lost' }),
    ];
    const appointments: Appointment[] = [
      { id: 'ap1', organizationId: 'org', leadId: 'a', title: 't', startsAt: '', endsAt: '', status: 'completed', createdAt: '', updatedAt: '' },
      { id: 'ap2', organizationId: 'org', leadId: 'b', title: 't', startsAt: '', endsAt: '', status: 'no_show', createdAt: '', updatedAt: '' },
    ];
    const applications: Application[] = [
      { id: 'app1', organizationId: 'org', leadId: 'a', productType: 'Term Life', status: 'submitted', createdAt: '', updatedAt: '' },
    ];
    const policies: Policy[] = [
      { id: 'p1', organizationId: 'org', leadId: 'a', policyNumber: 'X', carrier: 'C', productType: 'Term Life', status: 'active', premium: 120, createdAt: '', updatedAt: '' },
    ];
    const m = computeDashboardMetrics({
      leads,
      appointments,
      applications,
      policies,
      campaigns: [{ id: 'cmp', name: 'c', spend: 1000, leadsGenerated: 3 }],
      now,
    });

    expect(m.totalLeads).toBe(3);
    expect(m.qualifiedLeads).toBe(2);
    expect(m.highPriorityLeads).toBe(1);
    expect(m.appointmentShowRate).toBe(0.5); // 1 completed of 2 showable
    expect(m.applicationsSubmitted).toBe(1);
    expect(m.policiesIssued).toBe(1);
    expect(m.closedRevenue).toBe(120);
    expect(m.costPerLead).toBeCloseTo(333.33, 1);
  });

  it('never divides by zero', () => {
    const m = computeDashboardMetrics({
      leads: [],
      appointments: [],
      applications: [],
      policies: [],
      campaigns: [],
      now,
    });
    expect(m.costPerLead).toBe(0);
    expect(m.leadToAppointmentRate).toBe(0);
    expect(m.appointmentToCloseRate).toBe(0);
  });

  it('estimateLeadValue scales with band', () => {
    expect(estimateLeadValue(lead({ scoreBand: 'high_priority' }))).toBeGreaterThan(
      estimateLeadValue(lead({ scoreBand: 'nurture' })),
    );
  });
});
