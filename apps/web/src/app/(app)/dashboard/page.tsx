import Link from 'next/link';
import { KpiCard, Card } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { FunnelChart } from '@/components/funnel-chart';
import { BaselineVsPilot } from '@/components/baseline-vs-pilot';
import { getActiveOrg } from '@/lib/demo';
import { funnelReportForOrg, funnelComparisonForOrg } from '@/lib/metrics';
import { formatCurrency, formatDateTime, percent } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const org = getActiveOrg();
  const report = funnelReportForOrg(org);
  const comparison = funnelComparisonForOrg(org);
  const c = report.conversions;

  // Advisor performance.
  const advisorRows = org.profiles.slice(0, 3).map((p) => {
    const leads = org.leads.filter((l) => l.assignedAdvisorId === p.id);
    const appts = org.appointments.filter((a) => a.advisorId === p.id);
    return { name: p.fullName, leads: leads.length, appts: appts.length };
  });
  const recent = [...org.timeline].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);

  const responseLabel =
    report.responseTimeMinutes >= 60
      ? `${(report.responseTimeMinutes / 60).toFixed(1)}h`
      : `${report.responseTimeMinutes}m`;

  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        description="Did the pilot produce more qualified opportunities and revenue? The whole funnel, live from application data."
        actions={
          <Link
            href="/leads"
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright"
          >
            View leads
          </Link>
        }
      />

      {/* Conversion headline — the five rates Ben tracks. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Lead → Qualified" value={percent(c.leadToQualified)} deltaTone="up" />
        <KpiCard label="Qualified → Booked" value={percent(c.qualifiedToBooked)} />
        <KpiCard label="Booked → Show" value={percent(c.bookedToShow)} />
        <KpiCard label="Show → Next Step" value={percent(c.showToNextStep)} />
        <KpiCard label="Lead → Client" value={percent(c.leadToClient)} deltaTone="up" />
        <KpiCard label="Avg Response" value={responseLabel} hint="first touch" />
      </div>

      {/* Baseline vs Pilot — the testimonial-maker. */}
      {comparison && (
        <div className="mt-4">
          <BaselineVsPilot comparison={comparison} />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Full funnel */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Revenue Funnel</h3>
            <span className="text-[11px] text-slate-500">step conversion →</span>
          </div>
          <FunnelChart stages={report.stages} />
        </Card>

        {/* Economics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <KpiCard label="Pipeline Value" value={formatCurrency(report.pipelineValue)} hint="open opportunities" />
          <KpiCard label="Verified Revenue" value={formatCurrency(report.verifiedRevenue)} deltaTone="up" hint="issued" />
          <KpiCard label="Cost / Lead" value={formatCurrency(report.costPerLead)} />
          <KpiCard label="Cost / Qualified" value={formatCurrency(report.costPerQualifiedLead)} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Source conversion */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Source Conversion</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 text-right font-medium">Leads</th>
                  <th className="pb-2 text-right font-medium">Qual %</th>
                  <th className="pb-2 text-right font-medium">Client %</th>
                </tr>
              </thead>
              <tbody>
                {report.sources.map((s) => (
                  <tr key={s.source} className="border-t border-white/5">
                    <td className="py-2 capitalize text-slate-300">{s.source.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right tabular-nums text-slate-300">{s.leads}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{percent(s.leadToQualified)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{percent(s.leadToClient)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Campaign conversion */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Campaign Conversion</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 font-medium">Campaign</th>
                  <th className="pb-2 text-right font-medium">Visits</th>
                  <th className="pb-2 text-right font-medium">Leads</th>
                  <th className="pb-2 text-right font-medium">Visit→Lead</th>
                  <th className="pb-2 text-right font-medium">CPL</th>
                </tr>
              </thead>
              <tbody>
                {report.campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="py-2 text-slate-300">{c.name}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{c.visits.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums text-slate-300">{c.leads}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{percent(c.visitToLead)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{formatCurrency(c.costPerLead)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
