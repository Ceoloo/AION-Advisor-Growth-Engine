/**
 * Brand design tokens. Modern fintech SaaS: dark navy/black base, electric
 * blue primary, green for positive, restrained gold accents. Consumed by the
 * web app's Tailwind theme and by score/status color helpers.
 */
import type { ScoreBand } from '@aion/types';

export const BRAND = {
  navy: '#0b1220',
  navyElevated: '#111a2e',
  ink: '#0a0f1a',
  white: '#f8fafc',
  blue: '#2563eb',
  blueBright: '#3b82f6',
  green: '#10b981',
  gold: '#d4af37',
  red: '#ef4444',
  amber: '#f59e0b',
  slate: '#64748b',
} as const;

export const SCORE_BAND_META: Record<
  ScoreBand,
  { label: string; color: string; textClass: string; bgClass: string }
> = {
  low_priority: { label: 'Low Priority', color: BRAND.slate, textClass: 'text-slate-300', bgClass: 'bg-slate-500/15' },
  nurture: { label: 'Nurture', color: BRAND.amber, textClass: 'text-amber-300', bgClass: 'bg-amber-500/15' },
  qualified: { label: 'Qualified', color: BRAND.blueBright, textClass: 'text-blue-300', bgClass: 'bg-blue-500/15' },
  high_priority: { label: 'High Priority', color: BRAND.green, textClass: 'text-emerald-300', bgClass: 'bg-emerald-500/15' },
  immediate_follow_up: { label: 'Immediate', color: BRAND.gold, textClass: 'text-yellow-300', bgClass: 'bg-yellow-500/15' },
};
