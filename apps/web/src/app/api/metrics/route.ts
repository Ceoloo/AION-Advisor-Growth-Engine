import { NextResponse } from 'next/server';
import { getActiveOrg } from '@/lib/demo';
import { funnelReportForOrg, funnelComparisonForOrg } from '@/lib/metrics';

/**
 * Read-only KPI snapshot for the active tenant: the full revenue funnel
 * ("AFTER AION"), conversion rates, operational metrics, source/campaign
 * breakdowns, and the BEFORE-vs-AFTER comparison against the recorded baseline.
 */
export async function GET() {
  const org = getActiveOrg();
  const report = funnelReportForOrg(org);
  const comparison = funnelComparisonForOrg(org);

  return NextResponse.json({
    ok: true,
    organizationId: org.organization.id,
    funnel: report.stages,
    conversions: report.conversions,
    responseTimeMinutes: report.responseTimeMinutes,
    costPerLead: report.costPerLead,
    costPerQualifiedLead: report.costPerQualifiedLead,
    pipelineValue: report.pipelineValue,
    verifiedRevenue: report.verifiedRevenue,
    sources: report.sources,
    campaigns: report.campaigns,
    comparison: comparison
      ? { baseline: comparison.baseline, pilot: comparison.pilot, stages: comparison.stages, rates: comparison.rates, responseTime: comparison.responseTime }
      : null,
    timestamp: new Date().toISOString(),
  });
}
