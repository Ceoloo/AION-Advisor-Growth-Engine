import { Card, Badge } from '@aion/ui';
import { getCapabilities, isDemoMode, MODE_LABEL } from '@aion/shared';
import { computeSystemHealth, type HealthLevel, type OpsEventStatus } from '@aion/observability';
import { PageHeader } from '@/components/page-header';
import { opsRecorder } from '@/lib/observability';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LEVEL_TONE: Record<HealthLevel, 'green' | 'amber' | 'red' | 'neutral'> = {
  operational: 'green',
  degraded: 'amber',
  down: 'red',
  unknown: 'neutral',
};

const STATUS_TONE: Record<OpsEventStatus, 'green' | 'amber' | 'red' | 'neutral' | 'blue'> = {
  success: 'green',
  retry: 'amber',
  failure: 'red',
  dead_letter: 'red',
  suppressed: 'neutral',
};

export default function SystemHealthPage() {
  const caps = getCapabilities();
  const recorder = opsRecorder();
  const health = computeSystemHealth(recorder.all(), {
    demo: isDemoMode(),
    baselineDetail: {
      ghl: caps.simulateGHL ? 'Simulated (mock services) — healthy' : 'Live',
      airtable: caps.allowProductionCrmWrites ? 'Live CRM writes enabled' : 'Writes suppressed in current mode',
      ai: caps.useMockAI ? 'Mock provider — healthy' : 'Live provider',
    },
  });
  const events = recorder.list({ limit: 25 });

  const totalRetries = health.components.reduce((s, c) => s + c.stats.retryCount, 0);
  const totalFailures = health.components.reduce((s, c) => s + c.stats.failure, 0);
  const totalDeadLetter = health.components.reduce((s, c) => s + c.stats.deadLetter, 0);

  return (
    <>
      <PageHeader
        title="AION System Health"
        description="Live operational status across every subsystem — so we know when something breaks before real leads flow through."
      />

      {/* Overall banner */}
      <Card
        className={`p-5 ${
          health.level === 'operational'
            ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
            : health.level === 'down'
              ? 'border-red-500/30 bg-red-500/[0.06]'
              : 'border-amber-500/30 bg-amber-500/[0.06]'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-3xl">
              {health.light}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Overall status
              </p>
              <p className="text-2xl font-semibold capitalize text-white">{health.level}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Stat label="Events" value={health.eventCount} />
            <Stat label="Retries" value={totalRetries} />
            <Stat label="Failures" value={totalFailures} tone={totalFailures > 0 ? 'amber' : undefined} />
            <Stat label="Dead-letter" value={totalDeadLetter} tone={totalDeadLetter > 0 ? 'red' : undefined} />
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Mode</p>
              <p className="font-medium text-slate-200">{MODE_LABEL[caps.mode]}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Component grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {health.components.map((c) => (
          <Card key={c.component} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{c.label}</span>
              <span aria-hidden className="text-lg" title={c.level}>
                {c.light}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
              <Badge tone="green">{c.stats.success} ok</Badge>
              {c.stats.retrying > 0 && <Badge tone="amber">{c.stats.retrying} retry</Badge>}
              {c.stats.failure > 0 && <Badge tone="red">{c.stats.failure} fail</Badge>}
              {c.stats.deadLetter > 0 && <Badge tone="red">{c.stats.deadLetter} DLQ</Badge>}
              {c.stats.suppressed > 0 && <Badge tone="neutral">{c.stats.suppressed} suppressed</Badge>}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent event stream (structured logs) */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Recent operational events</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Component</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Attempts</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-white/5 align-top">
                  <td className="py-2 pr-3 text-xs tabular-nums text-slate-500">{formatDateTime(e.at)}</td>
                  <td className="py-2 pr-3 text-slate-300">{e.component}</td>
                  <td className="py-2 pr-3 text-xs text-slate-400">{e.type.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={STATUS_TONE[e.status]}>{e.status.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-400">{e.retryCount}</td>
                  <td className="py-2 text-xs text-slate-400">
                    {e.message}
                    {e.error && <span className="block text-red-300/80">{e.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-[11px] text-slate-500">
        Telemetry is process-local in the demo (a rolling in-memory window) and mirrored to the
        structured log stream. In production this sink is swapped for durable storage + alerting
        (Sentry/PostHog wiring is stubbed) without changing call sites.
      </p>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'red' }) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'amber' ? 'text-amber-300' : 'text-white';
  return (
    <div className="text-right">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
