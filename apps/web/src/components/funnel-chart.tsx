import type { FunnelStage } from '@aion/analytics';
import { formatCurrency, percent } from '@/lib/format';

/**
 * The full revenue funnel: Traffic → … → Verified Revenue. Each bar is scaled
 * to the largest countable stage; the step conversion from the previous stage
 * is shown on the right so the leak points are obvious at a glance.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const countable = stages.filter((s) => !s.isCurrency);
  const max = Math.max(...countable.map((s) => s.value), 1);

  return (
    <div className="space-y-2.5">
      {stages.map((s) => {
        const width = s.isCurrency ? 100 : Math.max((s.value / max) * 100, 3);
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-slate-400">{s.label}</span>
            <div className="h-7 flex-1 overflow-hidden rounded-md bg-white/5">
              <div
                className={`flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white ${
                  s.isCurrency
                    ? 'bg-gradient-to-r from-emerald-600/70 to-emerald-500'
                    : 'bg-gradient-to-r from-brand-blue/60 to-brand-blue'
                }`}
                style={{ width: `${width}%` }}
              >
                {s.isCurrency ? formatCurrency(s.value) : s.value.toLocaleString()}
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
              {s.conversionFromPrev == null ? '—' : percent(s.conversionFromPrev)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
