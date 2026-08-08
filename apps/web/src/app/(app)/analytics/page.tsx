import { Card, KpiCard } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { dashboardMetricsForOrg } from '@/lib/metrics';
import { formatCurrency, percent } from '@/lib/format';

export default function AnalyticsPage() {
  const org = getActiveOrg();
  const m = dashboardMetricsForOrg(org);

  const campaigns = org.campaigns.map((c) => ({
    ...c,
    cpl: c.leadsGenerated ? c.spend / c.leadsGenerated : 0,
  }));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Funnel, conversion, and campaign performance. Structured for live metrics."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Lead → Appt" value={percent(m.leadToAppointmentRate)} />
        <KpiCard label="Appt → Close" value={percent(m.appointmentToCloseRate)} />
        <KpiCard label="Show rate" value={percent(m.appointmentShowRate)} />
        <KpiCard label="Cost / Acquisition" value={formatCurrency(m.costPerAcquisition)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Conversion Table</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Total leads', m.totalLeads],
                ['Qualified leads', m.qualifiedLeads],
                ['Appointments booked', m.appointmentsBooked],
                ['Applications submitted', m.applicationsSubmitted],
                ['Policies issued', m.policiesIssued],
                ['Closed revenue', formatCurrency(m.closedRevenue)],
                ['Estimated pipeline value', formatCurrency(m.estimatedPipelineValue)],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-b border-white/5">
                  <td className="py-2 text-slate-400">{label}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-slate-200">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">Campaign</th>
                  <th className="pb-2 text-right font-medium">Spend</th>
                  <th className="pb-2 text-right font-medium">Leads</th>
                  <th className="pb-2 text-right font-medium">CPL</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="py-2 text-slate-300">{c.name}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{formatCurrency(c.spend)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{c.leadsGenerated}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{formatCurrency(c.cpl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
