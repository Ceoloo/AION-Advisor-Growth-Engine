import { Card, Badge } from '@aion/ui';
import {
  resolveRuntimeMode,
  MODE_LABEL,
  type RuntimeMode,
  type GateCheck,
  type ModeCapabilities,
} from '@aion/shared';
import { PageHeader } from '@/components/page-header';

export const dynamic = 'force-dynamic';

const MODE_ORDER: RuntimeMode[] = ['demo', 'pilot', 'production'];

const MODE_META: Record<RuntimeMode, { icon: string; blurb: string; tone: 'gold' | 'blue' | 'green' }> = {
  demo: {
    icon: '🧪',
    blurb: 'Seeded data, mock AI, simulated GoHighLevel. No outbound messages, no production CRM writes.',
    tone: 'gold',
  },
  pilot: {
    icon: '🚀',
    blurb: 'Real branding, approved funnel, live GoHighLevel & calendar. Controlled volume with a human in the loop.',
    tone: 'blue',
  },
  production: {
    icon: '🌐',
    blurb: 'Fully approved automation, live campaigns, monitoring & SLA. Human-approval gates released.',
    tone: 'green',
  },
};

const CAP_LABELS: { key: keyof ModeCapabilities; label: string; goodWhenTrue?: boolean }[] = [
  { key: 'useMockData', label: 'Uses seeded demo data' },
  { key: 'useMockAI', label: 'Uses mock AI provider' },
  { key: 'simulateGHL', label: 'GoHighLevel simulated' },
  { key: 'allowOutboundMessages', label: 'Outbound messages allowed', goodWhenTrue: true },
  { key: 'allowProductionCrmWrites', label: 'Production CRM writes allowed', goodWhenTrue: true },
  { key: 'requireHumanApproval', label: 'Requires human approval' },
  { key: 'allowLiveCampaigns', label: 'Live campaigns allowed', goodWhenTrue: true },
  { key: 'controlledLeadVolume', label: 'Lead volume controlled' },
  { key: 'monitoringRequired', label: 'Monitoring required' },
];

function GateList({ title, checks, ready }: { title: string; checks: GateCheck[]; ready: boolean }) {
  const passed = checks.filter((c) => c.ok).length;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <Badge tone={ready ? 'green' : 'amber'}>
          {passed}/{checks.length} {ready ? 'ready' : 'pending'}
        </Badge>
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.key} className="flex items-start gap-2 text-sm">
            <span aria-hidden className={c.ok ? 'text-emerald-400' : 'text-slate-500'}>
              {c.ok ? '✓' : '○'}
            </span>
            <span className={c.ok ? 'text-slate-300' : 'text-slate-500'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ModePage() {
  const r = resolveRuntimeMode();
  const meta = MODE_META[r.effectiveMode];

  return (
    <>
      <PageHeader
        title="Runtime Mode"
        description="Demo → Pilot → Production is a deliberately gated promotion path. No single switch flips the system live."
      />

      {/* Current effective mode */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-3xl">
              {meta.icon}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Effective mode
              </p>
              <p className="text-2xl font-semibold text-white">{MODE_LABEL[r.effectiveMode]}</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            <span className="text-slate-500">Requested:</span>{' '}
            <Badge tone={MODE_META[r.requestedMode].tone}>{MODE_LABEL[r.requestedMode]}</Badge>
            {r.requestedMode !== r.effectiveMode && (
              <span className="ml-2 text-amber-300/90">↳ capped at {MODE_LABEL[r.effectiveMode]}</span>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-400">{meta.blurb}</p>
      </Card>

      {/* Promotion path */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {MODE_ORDER.map((m, i) => {
          const active = m === r.effectiveMode;
          const reached =
            MODE_ORDER.indexOf(m) <= MODE_ORDER.indexOf(r.effectiveMode);
          return (
            <Card
              key={m}
              className={`p-4 ${active ? 'border-brand-blue/50 bg-brand-blue/5' : reached ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span aria-hidden>{MODE_META[m].icon}</span>
                  {MODE_LABEL[m]}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  Step {i + 1}
                </span>
              </div>
              {active && (
                <p className="mt-2 text-[11px] font-medium text-brand-blue">● Current</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Blockers */}
      {r.blockers.length > 0 && (
        <Card className="mt-4 border-amber-500/30 bg-amber-500/[0.06] p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
            <span aria-hidden>⚠️</span> Blocking promotion to {MODE_LABEL[r.requestedMode]}
          </h3>
          <ul className="space-y-1.5">
            {r.blockers.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-amber-100/90">
                <span aria-hidden className="text-amber-400">
                  •
                </span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Set the required signals in the deployment environment and redeploy. Promotion is never
            available over the network — see <code className="text-slate-300">docs/environments.md</code>.
          </p>
        </Card>
      )}

      {/* Gate checklists */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GateList title="Pilot activation gates" checks={r.pilotChecks} ready={r.pilotReady} />
        <GateList
          title="Production activation gates"
          checks={r.productionChecks}
          ready={r.productionReady}
        />
      </div>

      {/* Capabilities */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Effective capabilities — {MODE_LABEL[r.effectiveMode]}
        </h3>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {CAP_LABELS.map(({ key, label, goodWhenTrue }) => {
            const on = r.capabilities[key] as boolean;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <Badge tone={on ? (goodWhenTrue ? 'green' : 'blue') : 'neutral'}>
                  {on ? 'On' : 'Off'}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        This is a read-only governance view. The runtime mode is resolved from the deployment
        environment on every request; there is no in-app control to change it.
      </p>
    </>
  );
}
