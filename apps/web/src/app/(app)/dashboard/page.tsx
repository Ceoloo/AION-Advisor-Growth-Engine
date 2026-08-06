import Link from 'next/link';
import { KpiCard, Card, ScoreBadge, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { dashboardMetricsForOrg } from '@/lib/metrics';
import { formatCurrency, formatDateTime, percent } from '@/lib/format';

export default function DashboardPage() {
  const org = getActiveOrg();
  const m = dashboardMetricsForOrg(org);

  // Lead-source performance.
  const bySource = new Map<string, number>();
  for (const l of org.leads) bySource.set(l.source ?? 'unknown', (bySource.get(l.source ?? 'unknown') ?? 0) + 1);
  const sourceRows = [...bySource.entries()].sort((a, b) => b[1] - a[1]);

  // Advisor performance.
  const advisorRows = org.profiles.slice(1, 4).map((p) => {
    const leads = org.leads.filter((l) => l.assignedAdvisorId === p.id);
    const appts = org.appointments.filter((a) => a.advisorId === p.id);
    return { name: p.fullName, leads: leads.length, appts: appts.length };
  });

  const recent = [...org.timeline].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);
  const funnel = [
    { label: 'Leads', value: m.totalLeads },
    { label: 'Qualified', value: m.qualifiedLeads },
    { label: 'Appointments', value: m.appointmentsBooked },
    { label: 'Applications', value: m.applicationsSubmitted },
    { label: 'Policies', value: m.policiesIssued },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        description="Live from application data. Filter by date, team, source, and advisor in a live deployment."
        actions={
          <Link
            href="/leads"
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright"
          >
            View leads
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total Leads" value={m.totalLeads} hint={`${m.newLeadsThisWeek} new this week`} />
        <KpiCard label="Qualified" value={m.qualifiedLeads} deltaTone="up" delta={`${m.highPriorityLeads} high-priority`} />
        <KpiCard label="Appointments" value={m.appointmentsBooked} hint={`${percent(m.appointmentShowRate)} show rate`} />
        <KpiCard label="Policies Issued" value={m.policiesIssued} deltaTone="up" />
        <KpiCard label="Closed Revenue" value={formatCurrency(m.closedRevenue)} deltaTone="up" />
        <KpiCard label="Pipeline Value" value={formatCurrency(m.estimatedPipelineValue)} hint="estimated" />
        <KpiCard label="Lead → Appt" value={percent(m.leadToAppointmentRate)} />
        <KpiCard label="Appt → Close" value={percent(m.appointmentToCloseRate)} />
        <KpiCard label="Cost / Lead" value={formatCurrency(m.costPerLead)} />
        <KpiCard label="Cost / Appt" value={formatCurrency(m.costPerAppointment)} />
        <KpiCard label="Cost / Acq." value={formatCurrency(m.costPerAcquisition)} />
        <KpiCard label="Avg Response" value={`${m.averageResponseTimeMinutes}m`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-slate-400">{f.label}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/5">
                  <div
                    className="flex h-full items-center justify-end bg-gradient-to-r from-brand-blue/70 to-brand-blue px-2 text-[11px] font-medium text-white"
                    style={{ width: `${Math.max((f.value / funnelMax) * 100, 8)}%` }}
                  >
                    {f.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Renewals + referrals summary */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Opportunities</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Renewal opportunities</span>
              <Badge tone="gold">{m.renewalOpportunities}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Applications started</span>
              <Badge tone="blue">{m.applicationsStarted}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Applications submitted</span>
              <Badge tone="green">{m.applicationsSubmitted}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">High-priority leads</span>
              <Badge tone="green">{m.highPriorityLeads}</Badge>
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Lead source performance */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Lead Source Performance</h3>
          <ul className="space-y-2">
            {sourceRows.map(([src, count]) => (
              <li key={src} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-400">{src.replace(/_/g, ' ')}</span>
                <span className="font-medium tabular-nums text-slate-200">{count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Advisor performance */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Advisor Performance</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Advisor</th>
                <th className="pb-2 text-right font-medium">Leads</th>
                <th className="pb-2 text-right font-medium">Appts</th>
              </tr>
            </thead>
            <tbody>
              {advisorRows.map((a) => (
                <tr key={a.name} className="border-t border-white/5">
                  <td className="py-2 text-slate-300">{a.name}</td>
                  <td className="py-2 text-right tabular-nums text-slate-300">{a.leads}</td>
                  <td className="py-2 text-right tabular-nums text-slate-300">{a.appts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Recent activity */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Recent Activity</h3>
          <ul className="space-y-2.5">
            {recent.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <div>
                  <p className="text-slate-300">{e.label}</p>
                  <p className="text-slate-500">
                    {e.actorType} · {formatDateTime(e.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
