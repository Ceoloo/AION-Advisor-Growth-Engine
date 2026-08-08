/** Score bands for the 0–100 Advisor Conversion Infrastructure Score. */
export interface Band {
  key: string;
  label: string;
  min: number;
  max: number;
  summary: string;
}

export const BANDS: Band[] = [
  {
    key: 'critical',
    label: 'Critical Infrastructure Gaps',
    min: 0,
    max: 29,
    summary:
      'Core parts of your prospect journey are missing or manual. The upside from fixing the fundamentals is substantial.',
  },
  {
    key: 'high_leakage',
    label: 'High Leakage Risk',
    min: 30,
    max: 49,
    summary:
      'Prospects are likely falling out at several points between first contact and a qualified conversation.',
  },
  {
    key: 'conversion_gaps',
    label: 'Conversion Gaps',
    min: 50,
    max: 69,
    summary:
      'You have real foundations, but specific gaps are leaking otherwise-winnable opportunities.',
  },
  {
    key: 'strong_foundation',
    label: 'Strong Foundation',
    min: 70,
    max: 84,
    summary:
      'Your conversion infrastructure is solid. Targeted improvements can compound into meaningful gains.',
  },
  {
    key: 'optimized',
    label: 'Optimized Growth Engine',
    min: 85,
    max: 100,
    summary:
      'Your process is well built end-to-end. The focus now is optimization and consistency at scale.',
  },
];

export function bandForScore(total: number): Band {
  const clamped = Math.max(0, Math.min(100, total));
  return BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? BANDS[0]!;
}
