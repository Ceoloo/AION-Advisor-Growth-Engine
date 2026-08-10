import type { FunnelComparison } from '@aion/analytics';
import { Card } from '@aion/ui';
import { formatCurrency } from '@/lib/format';

function lift(liftPct: number | null): { text: string; tone: string } {
  if (liftPct == null) return { text: 'new', tone: 'text-emerald-400' };
  if (liftPct === 0) return { text: '—', tone: 'text-slate-500' };
  const sign = liftPct > 0 ? '+' : '';
  const tone = liftPct > 0 ? 'text-emerald-400' : 'text-red-400';
  return { text: `${sign}${Math.round(liftPct * 100)}%`, tone };
}

const fmt = (v: number, currency: boolean) => (currency ? formatCurrency(v) : v.toLocaleString());

/**
 * BEFORE AION vs AFTER AION — the comparison that becomes the testimonial.
 * Two columns of the same funnel, side by side, with the lift on each stage.
 */
export function BaselineVsPilot({ comparison }: { comparison: FunnelComparison }) {
  const { baseline, pilot, stages, responseTime } = comparison;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Baseline vs Pilot</h3>
        <p className="text-xs text-slate-400">
          What changed after turning on AION — the numbers that become the testimonial.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-2.5 font-medium">Stage</th>
              <th className="px-3 py-2.5 text-right font-medium">
                Before AION
                <span className="block text-[10px] normal-case tracking-normal text-slate-600">
                  {baseline.periodLabel}
                </span>
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                After AION
                <span className="block text-[10px] normal-case tracking-normal text-slate-600">
                  {pilot.periodLabel}
                </span>
              </th>
              <th className="px-5 py-2.5 text-right font-medium">Lift</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => {
              const l = lift(s.liftPct);
              return (
                <tr key={s.key} className="border-t border-white/5">
                  <td className="px-5 py-2.5 text-slate-300">{s.label}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">
                    {fmt(s.before, s.isCurrency)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-white">
                    {fmt(s.after, s.isCurrency)}
                  </td>
                  <td className={`px-5 py-2.5 text-right font-medium tabular-nums ${l.tone}`}>{l.text}</td>
                </tr>
              );
            })}
            {responseTime && (
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td className="px-5 py-2.5 text-slate-300">First response time</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">
                  {responseTime.before} min
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-white">
                  {responseTime.after} min
                </td>
                <td className="px-5 py-2.5 text-right font-medium tabular-nums text-emerald-400">
                  {responseTime.before > 0
                    ? `−${Math.round((1 - responseTime.after / responseTime.before) * 100)}%`
                    : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
