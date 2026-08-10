import { computeDashboardMetrics, computeFunnel, compareFunnel } from '@aion/analytics';
import type { FunnelComparison, FunnelReport } from '@aion/analytics';
import type { DemoOrg } from '@aion/database/demo';
import { getClientByOrg, type ClientConfig } from '@aion/clients';

/** Compute the executive dashboard KPIs for a tenant from its records. */
export function dashboardMetricsForOrg(org: DemoOrg) {
  return computeDashboardMetrics({
    leads: org.leads,
    appointments: org.appointments,
    applications: org.applications,
    policies: org.policies,
    campaigns: org.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      spend: c.spend,
      leadsGenerated: c.leadsGenerated,
    })),
  });
}

/**
 * Pilot ("AFTER AION") first-response time derived from the client's follow-up
 * cadence: the first cadence step's delay, floored to a few minutes to reflect
 * automated instant outreach. Falls back to a small default when no cadence.
 */
export function pilotResponseMinutes(config?: ClientConfig): number {
  if (!config || config.followupCadence.length === 0) return 8;
  const firstStep = Math.min(...config.followupCadence.map((s) => s.afterHours));
  return firstStep <= 0 ? 5 : Math.round(firstStep * 60);
}

/** Compute the full funnel report ("AFTER AION") for a tenant. */
export function funnelReportForOrg(org: DemoOrg): FunnelReport {
  const config = getClientByOrg(org.organization.id);
  return computeFunnel({
    leads: org.leads,
    appointments: org.appointments,
    opportunities: org.opportunities,
    policies: org.policies,
    campaigns: org.campaigns,
    responseTimeMinutes: pilotResponseMinutes(config),
    periodLabel: config?.pilotPeriodLabel ?? 'Pilot to date (with AION)',
  });
}

/**
 * BEFORE-vs-AFTER comparison: the tenant's recorded baseline (from ClientConfig)
 * against the live pilot funnel. Null when the client has no recorded baseline.
 */
export function funnelComparisonForOrg(org: DemoOrg): FunnelComparison | null {
  const config = getClientByOrg(org.organization.id);
  if (!config?.baseline) return null;
  const report = funnelReportForOrg(org);
  return compareFunnel(config.baseline, report.snapshot);
}
