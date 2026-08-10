import { Card, Badge } from '@aion/ui';
import { getCapabilities, MODE_LABEL } from '@aion/shared';
import { getActiveClient } from '@aion/clients';
import { evaluateLiveCampaignGate } from '@aion/compliance';
import { PageHeader } from '@/components/page-header';
import { LaunchCampaignButton } from '@/components/launch-campaign-button';

export const dynamic = 'force-dynamic';

export default function LaunchPage() {
  const client = getActiveClient();
  const caps = getCapabilities();
  const gate = evaluateLiveCampaignGate(client.launchApprovals ?? {}, caps);
  const { readiness } = gate;

  return (
    <>
      <PageHeader
        title="Launch Readiness"
        description="Compliance approvals as a real launch gate. Live campaigns are blocked in application logic until every critical approval is complete — it cannot be bypassed from the UI."
      />

      {/* Headline status */}
      <Card
        className={`p-5 ${
          readiness.launchEligible ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-amber-500/30 bg-amber-500/[0.06]'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {client.advisor.name} · {client.displayName}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {readiness.launchEligible ? (
                <span className="text-emerald-300">✓ Launch Eligible</span>
              ) : (
                <span className="text-amber-300">Approvals Pending</span>
              )}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {readiness.approvedCritical}/{readiness.totalCritical} critical approvals complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Live campaigns</p>
            {gate.allowed ? (
              <Badge tone="green">ALLOWED</Badge>
            ) : (
              <Badge tone="red">BLOCKED</Badge>
            )}
            <p className="mt-1 text-xs text-slate-500">Runtime mode: {MODE_LABEL[caps.mode]}</p>
          </div>
        </div>

        {!gate.allowed && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-300">
              ⛔ Live campaign = blocked
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-red-200/90">
              {gate.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Two-gate explanation */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">Gate 1 · Compliance approvals</span>
            <Badge tone={readiness.launchEligible ? 'green' : 'amber'}>
              {readiness.launchEligible ? 'Complete' : 'Pending'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Every critical approval below must be signed off.</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">Gate 2 · Runtime mode</span>
            <Badge tone={caps.allowLiveCampaigns ? 'green' : 'amber'}>
              {caps.allowLiveCampaigns ? 'Permits live' : MODE_LABEL[caps.mode]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Live campaigns require production mode (see Runtime Mode).
          </p>
        </Card>
      </div>

      {/* Approval checklist (server-driven, not toggles) */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Critical approvals</h3>
        <ul className="space-y-2">
          {readiness.items.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <span aria-hidden className={`mt-0.5 ${item.approved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.approved ? '✓' : '○'}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${item.approved ? 'text-slate-200' : 'text-white'}`}>
                    {item.label}
                  </p>
                  {item.approved ? (
                    <Badge tone="green">Approved</Badge>
                  ) : (
                    <Badge tone="amber">Pending</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{item.detail}</p>
                {item.approved && item.approvedBy && (
                  <p className="mt-0.5 text-[11px] text-slate-500">Signed off by {item.approvedBy}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Live enforcement demonstration */}
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-semibold text-slate-200">Enforcement</h3>
        <p className="mt-1 text-xs text-slate-500">
          The button calls the server launch endpoint. The gate runs server-side — a blocked launch is
          refused with a 403 and cannot be overridden from the UI.
        </p>
        <div className="mt-3">
          <LaunchCampaignButton />
        </div>
      </Card>

      <p className="mt-4 text-[11px] text-slate-500">
        This is an internal launch-readiness control, not a legal or compliance determination. Approvals
        are recorded in the client configuration; live GoHighLevel, messaging, and campaigns stay
        disconnected until both gates pass.
      </p>
    </>
  );
}
