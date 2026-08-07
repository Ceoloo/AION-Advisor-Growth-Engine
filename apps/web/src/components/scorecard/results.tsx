'use client';

import { Card, Badge } from '@aion/ui';
import type { ScorecardResult } from '@aion/scorecard';
import { ScoreDial, SectionMeter } from './score-meter';

interface Props {
  result: ScorecardResult;
  booking: { configured: boolean; url: string | null };
  demo: boolean;
  onBook: () => void;
  onSaveReport: () => void;
  onRestart: () => void;
  saved: boolean;
}

export function Results({ result, booking, demo, onBook, onSaveReport, onRestart, saved }: Props) {
  return (
    <div className="space-y-5">
      {demo && (
        <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-3 py-1.5 text-center text-xs text-yellow-200/90">
          Internal demo mode — no CRM records were written.
        </div>
      )}

      {/* Overall score */}
      <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <ScoreDial score={result.total} bandKey={result.bandKey} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Your Advisor Conversion Infrastructure Score
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{result.band}</p>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            {BAND_SUMMARY[result.bandKey] ?? ''}
          </p>
        </div>
      </Card>

      {/* Section scores */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">Your six sections</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {result.sections.map((s) => (
            <SectionMeter key={s.id} label={s.label} earned={s.earned} max={s.max} pct={s.pct} />
          ))}
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Primary leak */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Primary conversion leak</p>
          <p className="mt-1 text-lg font-semibold text-white">{result.primaryLeak.label}</p>
          <p className="mt-2 text-sm text-slate-400">
            This is where your prospect journey is losing the most, relative to what’s possible in that
            section.
          </p>
        </Card>

        {/* Doing well */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">What you’re doing well</p>
          {result.strengths.length ? (
            <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
              {result.strengths.map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-green">✓</span>
                  <span>
                    <strong className="text-white">{s.label}:</strong> {s.statement}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              The biggest opportunity right now is building the fundamentals across the funnel.
            </p>
          )}
        </Card>
      </div>

      {/* Top findings */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Your top 3 findings</h3>
        <ol className="space-y-3">
          {result.findings.map((f, i) => (
            <li key={f.questionId} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-blue/20 text-xs font-semibold text-blue-200">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.prompt}</p>
                  <p className="mt-1 text-xs text-slate-400">{f.observedGap}</p>
                  <p className="mt-1.5 text-sm text-slate-300">
                    <strong className="text-slate-200">Why it matters:</strong> {f.whyItMatters}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{f.implication}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* First fix + 30-day plan */}
      <Card className="border-brand-blue/30 bg-brand-blue/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Recommended first fix</p>
        <p className="mt-1 text-base font-semibold text-white">{result.recommendedFirstFix}</p>
        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Your 30-day priority plan
        </h4>
        <ol className="mt-2 space-y-2">
          {result.plan30Day.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] text-slate-300">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {/* Conversion CTA */}
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-white">Book My 15-Minute Advisor Growth Review</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
          We’ll walk through your score, identify the biggest conversion leak, and show you the first
          workflow we’d improve.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            onClick={onBook}
            className="w-full max-w-xs rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright sm:w-auto"
          >
            Book My 15-Minute Advisor Growth Review
          </button>
          <button
            onClick={onSaveReport}
            className="w-full max-w-xs rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 sm:w-auto"
          >
            {saved ? 'Report saved ✓' : 'Email / Save My Report'}
          </button>
        </div>
        {!booking.configured && (
          <p className="mt-3 text-xs text-slate-500">
            Booking opens shortly — your interest has been noted and we’ll reach out with times.
          </p>
        )}
        <button onClick={onRestart} className="mt-4 text-xs text-slate-500 underline-offset-2 hover:underline">
          Restart the scorecard
        </button>
      </Card>

      <p className="text-center text-[11px] text-slate-500">
        This is a marketing and sales process diagnostic. It does not provide financial, investment,
        legal, tax, or insurance-product advice.
      </p>
    </div>
  );
}

const BAND_SUMMARY: Record<string, string> = {
  critical:
    'Core parts of your prospect journey are missing or manual. The upside from fixing the fundamentals is substantial.',
  high_leakage:
    'Prospects are likely falling out at several points between first contact and a qualified conversation.',
  conversion_gaps:
    'You have real foundations, but specific gaps are leaking otherwise-winnable opportunities.',
  strong_foundation:
    'Your conversion infrastructure is solid. Targeted improvements can compound into meaningful gains.',
  optimized:
    'Your process is well built end-to-end. The focus now is optimization and consistency at scale.',
};
