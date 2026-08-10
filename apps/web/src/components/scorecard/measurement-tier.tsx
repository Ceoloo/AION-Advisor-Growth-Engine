import type { MeasurementTier } from '@aion/types';

/**
 * Visual language for the AION measurement framework: Observed → Modeled →
 * Verified. Each tier has a fixed color and label so a modeled projection is
 * never visually confused with a measured or verified fact.
 */
export const TIER_STYLE: Record<
  MeasurementTier,
  { label: string; icon: string; chip: string; card: string; accent: string }
> = {
  observed: {
    label: 'Observed',
    icon: '●',
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    card: 'border-sky-500/20 bg-sky-500/[0.04]',
    accent: 'text-sky-300',
  },
  modeled: {
    label: 'Modeled',
    icon: '◇',
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    card: 'border-amber-500/25 bg-amber-500/[0.05]',
    accent: 'text-amber-300',
  },
  verified: {
    label: 'Verified',
    icon: '✓',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    card: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    accent: 'text-emerald-300',
  },
};

export function TierChip({ tier }: { tier: MeasurementTier }) {
  const s = TIER_STYLE[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.chip}`}
    >
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

/** A compact legend explaining the three tiers and the Observed → Modeled → Verified arc. */
export function MeasurementLegend() {
  const items: { tier: MeasurementTier; desc: string }[] = [
    { tier: 'observed', desc: 'measured facts' },
    { tier: 'modeled', desc: 'illustrative projection' },
    { tier: 'verified', desc: 'actual outcomes' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
      {items.map((it, i) => (
        <span key={it.tier} className="inline-flex items-center gap-1.5">
          <TierChip tier={it.tier} />
          <span className="text-slate-500">{it.desc}</span>
          {i < items.length - 1 && <span aria-hidden className="text-slate-600">→</span>}
        </span>
      ))}
    </div>
  );
}
