import { computeDashboardMetrics } from '@aion/analytics';
import type { DemoOrg } from '@aion/database/demo';

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
