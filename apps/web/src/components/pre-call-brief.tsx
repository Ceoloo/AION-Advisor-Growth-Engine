import { Card, Badge } from '@aion/ui';
import type { PreCallBrief } from '@aion/ai';

const URGENCY_TONE = { high: 'red', medium: 'amber', low: 'neutral' } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-200">{children}</p>
    </div>
  );
}

/**
 * The pre-call Advisor Brief — the prep sheet Ben reads before a booked call.
 * Answers the eight questions an advisor actually asks: who, why, what problem,
 * score, primary concern, urgency, what to ask, what to avoid assuming.
 */
export function PreCallBriefView({ brief }: { brief: PreCallBrief }) {
  return (
    <Card id="pre-call-brief" className="border-brand-blue/30 bg-brand-blue/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden>🧾</span>
          <h3 className="text-sm font-semibold text-white">Pre-Call Advisor Brief</h3>
        </div>
        <Badge tone="blue">Generated at booking</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Who is this?">{brief.who}</Field>
        <Field label="Why did they come?">{brief.whyTheyCame}</Field>
        <Field label="What problem did they identify?">{brief.problemIdentified}</Field>
        <Field label="Primary concern">{brief.primaryConcern}</Field>
        <Field label="Score">
          {brief.score} / 100 <span className="text-slate-500">({brief.scoreBand.replace(/_/g, ' ')})</span>
        </Field>
        <Field label="Urgency">
          <Badge tone={URGENCY_TONE[brief.urgency.level]}>{brief.urgency.label}</Badge>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            What should I ask?
          </p>
          <ul className="space-y-1.5">
            {brief.questionsToAsk.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span aria-hidden className="text-emerald-400">
                  ›
                </span>
                {q}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            What should I avoid assuming?
          </p>
          <ul className="space-y-1.5">
            {brief.avoidAssuming.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span aria-hidden className="text-amber-400">
                  ⚠
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Deterministic call preparation from the lead's own answers — advisor review required. Not
        financial, tax, or insurance-product advice.
      </p>
    </Card>
  );
}
