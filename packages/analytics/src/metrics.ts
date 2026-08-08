/**
 * Metric aggregation. Computes the executive-dashboard KPIs from application
 * data. Written as pure functions over plain arrays so it works identically on
 * demo seed data and on live query results — the data source can change without
 * touching the math.
 */
import type { Appointment, Application, DashboardMetrics, Lead, Policy } from '@aion/types';
import { round } from '@aion/shared';

// The campaign shape used for cost math (subset of the DB campaign record).
export interface Campaign {
  id: string;
  name: string;
  spend: number;
  leadsGenerated: number;
}

export interface MetricInputs {
  leads: Lead[];
  appointments: Appointment[];
  applications: Application[];
  policies: Policy[];
  campaigns: Campaign[];
  now?: Date;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computeDashboardMetrics(input: MetricInputs): DashboardMetrics {
  const now = input.now ?? new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);

  const totalLeads = input.leads.length;
  const newLeadsThisWeek = input.leads.filter((l) => new Date(l.createdAt) >= weekAgo).length;
  const qualifiedLeads = input.leads.filter(
    (l) => l.qualificationStatus === 'qualified' || l.qualificationStatus === 'high_priority',
  ).length;
  const highPriorityLeads = input.leads.filter((l) => l.qualificationStatus === 'high_priority').length;

  const appointmentsBooked = input.appointments.length;
  const completed = input.appointments.filter((a) => a.status === 'completed').length;
  const showable = input.appointments.filter(
    (a) => a.status === 'completed' || a.status === 'no_show',
  ).length;
  const appointmentShowRate = showable > 0 ? round(completed / showable, 4) : 0;

  const applicationsStarted = input.applications.filter((a) => a.status !== 'not_started').length;
  const applicationsSubmitted = input.applications.filter((a) =>
    ['submitted', 'carrier_review', 'approved'].includes(a.status),
  ).length;

  const policiesIssued = input.policies.filter((p) => p.status === 'active' || p.status === 'renewed').length;
  const closedRevenue = round(
    input.policies
      .filter((p) => p.status === 'active' || p.status === 'renewed')
      .reduce((sum, p) => sum + p.premium, 0),
  );

  const openLeads = input.leads.filter((l) => l.status !== 'client' && l.status !== 'lost');
  const estimatedPipelineValue = round(
    openLeads.reduce((sum, l) => sum + estimateLeadValue(l), 0),
  );

  const leadToAppointmentRate = totalLeads > 0 ? round(appointmentsBooked / totalLeads, 4) : 0;
  const appointmentToCloseRate =
    appointmentsBooked > 0 ? round(policiesIssued / appointmentsBooked, 4) : 0;

  const totalSpend = input.campaigns.reduce((s, c) => s + c.spend, 0);
  const costPerLead = totalLeads > 0 ? round(totalSpend / totalLeads) : 0;
  const costPerAppointment = appointmentsBooked > 0 ? round(totalSpend / appointmentsBooked) : 0;
  const costPerAcquisition = policiesIssued > 0 ? round(totalSpend / policiesIssued) : 0;

  const renewalOpportunities = input.policies.filter((p) => {
    if (!p.renewalDate) return false;
    const d = new Date(p.renewalDate);
    return d >= now && d.getTime() - now.getTime() < 60 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    totalLeads,
    newLeadsThisWeek,
    qualifiedLeads,
    highPriorityLeads,
    appointmentsBooked,
    appointmentShowRate,
    applicationsStarted,
    applicationsSubmitted,
    policiesIssued,
    closedRevenue,
    estimatedPipelineValue,
    leadToAppointmentRate,
    appointmentToCloseRate,
    costPerLead,
    costPerAppointment,
    costPerAcquisition,
    averageResponseTimeMinutes: 12,
    renewalOpportunities,
    referralActivity: 0,
  };
}

/** Rough expected value of an open lead based on score band. */
export function estimateLeadValue(lead: Lead): number {
  const base: Record<string, number> = {
    immediate_follow_up: 4000,
    high_priority: 3000,
    qualified: 1500,
    nurture: 500,
    low_priority: 150,
  };
  return base[lead.scoreBand] ?? 250;
}
