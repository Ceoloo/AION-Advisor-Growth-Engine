'use client';

export const BAND_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high_leakage: '#f59e0b',
  conversion_gaps: '#3b82f6',
  strong_foundation: '#10b981',
  optimized: '#d4af37',
};

/** Radial dial for the overall 0–100 score. */
export function ScoreDial({ score, bandKey }: { score: number; bandKey: string }) {
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = BAND_COLOR[bandKey] ?? '#3b82f6';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums text-white">{score}</span>
        <span className="text-xs text-slate-500">of 100</span>
      </div>
    </div>
  );
}

/** Horizontal meter for a single section. */
export function SectionMeter({ label, earned, max, pct }: { label: string; earned: number; max: number; pct: number }) {
  const color = pct >= 0.7 ? '#10b981' : pct >= 0.45 ? '#3b82f6' : pct >= 0.25 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {earned}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct * 100, 3)}%`, background: color }} />
      </div>
    </div>
  );
}
