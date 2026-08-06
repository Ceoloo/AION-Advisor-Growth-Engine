/**
 * Reusable presentational components for the AION design system. Framework:
 * React + Tailwind. These are intentionally dependency-light and theme-aware
 * (dark-first). Higher-level, data-bound widgets (pipeline board, timeline)
 * live in the web app and compose these primitives.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import type { ScoreBand } from '@aion/types';
import { cn } from './cn.js';
import { SCORE_BAND_META } from './tokens.js';

// --- Card --------------------------------------------------------------------

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-[#111a2e] shadow-sm shadow-black/20',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-4 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold text-slate-200', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 pt-1', className)} {...props} />;
}

// --- Badge -------------------------------------------------------------------

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'blue' | 'green' | 'gold' | 'red' | 'amber' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-slate-500/15 text-slate-300',
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    gold: 'bg-yellow-500/15 text-yellow-300',
    red: 'bg-red-500/15 text-red-300',
    amber: 'bg-amber-500/15 text-amber-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

// --- Score badge -------------------------------------------------------------

export function ScoreBadge({ score, band }: { score: number; band: ScoreBand }) {
  const meta = SCORE_BAND_META[band];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        meta.bgClass,
        meta.textClass,
      )}
      title={`${meta.label} (${score})`}
    >
      <span className="tabular-nums">{score}</span>
      <span className="opacity-80">{meta.label}</span>
    </span>
  );
}

// --- KPI card ----------------------------------------------------------------

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  hint?: string;
}

export function KpiCard({ label, value, delta, deltaTone = 'flat', hint }: KpiCardProps) {
  const deltaColor =
    deltaTone === 'up' ? 'text-emerald-400' : deltaTone === 'down' ? 'text-red-400' : 'text-slate-400';
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {delta && <span className={cn('text-xs font-medium', deltaColor)}>{delta}</span>}
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
    </Card>
  );
}

// --- State views -------------------------------------------------------------

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-sm text-slate-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
      {label}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description }: { title?: string; description?: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-red-300">{title}</p>
      {description && <p className="mt-1 text-sm text-red-400/80">{description}</p>}
    </div>
  );
}

export function ComplianceAlert({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-200/90">
      <span aria-hidden>⚠️</span>
      <span>{children}</span>
    </div>
  );
}
