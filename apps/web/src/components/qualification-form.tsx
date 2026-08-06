'use client';

import { useState } from 'react';
import { Card, ScoreBadge, Badge, ComplianceAlert } from '@aion/ui';
import type { ScoreBand } from '@aion/types';

export interface FormQuestion {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'boolean' | 'text' | 'number';
  options?: string[];
  required?: boolean;
  sensitive?: boolean;
}

interface QualifyResponse {
  ok: boolean;
  error?: string;
  score?: { total: number; band: ScoreBand; breakdown: Record<string, number> };
  qualification?: {
    qualificationStatus: string;
    intentScore: number;
    urgencyScore: number;
    needsSummary: string;
    productInterests: string[];
    recommendedNextAction: string;
    appointmentReady: boolean;
    missingInformation: string[];
  };
}

export function QualificationForm({
  vertical,
  title,
  questions,
}: {
  vertical: string;
  title: string;
  questions: FormQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<QualifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function set(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/qualify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vertical, answers }),
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">{title}</h3>
        <p className="mb-4 text-xs text-slate-500">
          Answers feed the deterministic scoring engine and the AI qualification gateway.
        </p>
        <form onSubmit={submit} className="space-y-3">
          {questions.map((q) => (
            <div key={q.key}>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                {q.label}
                {q.sensitive && <Badge tone="amber">sensitive</Badge>}
              </label>
              {q.type === 'select' && (
                <select
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
                  value={String(answers[q.key] ?? '')}
                  onChange={(e) => set(q.key, e.target.value)}
                >
                  <option value="" className="bg-navy">
                    Select…
                  </option>
                  {q.options?.map((o) => (
                    <option key={o} value={o} className="bg-navy">
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {q.type === 'boolean' && (
                <div className="flex gap-2">
                  {['Yes', 'No'].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => set(q.key, opt === 'Yes')}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm ${
                        answers[q.key] === (opt === 'Yes')
                          ? 'border-brand-blue bg-brand-blue/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {(q.type === 'text' || q.type === 'number') && (
                <input
                  type={q.type === 'number' ? 'number' : 'text'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
                  value={String(answers[q.key] ?? '')}
                  onChange={(e) => set(q.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white hover:bg-brand-bright disabled:opacity-60"
          >
            {loading ? 'Scoring…' : 'Qualify & score'}
          </button>
        </form>
      </Card>

      <div className="space-y-4">
        {result?.ok && result.score && result.qualification ? (
          <>
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Result</h3>
                <ScoreBadge score={result.score.total} band={result.score.band} />
              </div>
              <p className="text-sm text-slate-300">{result.qualification.needsSummary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="blue">Intent {result.qualification.intentScore}</Badge>
                <Badge tone="amber">Urgency {result.qualification.urgencyScore}</Badge>
                <Badge tone={result.qualification.appointmentReady ? 'green' : 'neutral'}>
                  {result.qualification.appointmentReady ? 'Appointment ready' : 'Not ready'}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommended next action
              </p>
              <p className="text-sm text-white">{result.qualification.recommendedNextAction}</p>
              <div className="mt-3">
                <ComplianceAlert>Educational only — advisor review required before any recommendation.</ComplianceAlert>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Score Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(result.score.breakdown).map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 text-xs capitalize text-slate-400">
                      {cat.replace(/_/g, ' ')}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-brand-blue" style={{ width: `${val}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-slate-400">
                      {Math.round(Number(val))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-slate-500">
              {result?.error ? `Error: ${result.error}` : 'Complete the form to see the score and AI qualification.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
