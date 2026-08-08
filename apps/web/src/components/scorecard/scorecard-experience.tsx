'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@aion/ui';
import {
  QUESTIONS,
  SECTIONS,
  DEMO_ANSWERS,
  DEMO_CONTACT,
  type Contact,
  type ScorecardResult,
} from '@aion/scorecard';
import { Landing } from './landing';
import { QuestionCard } from './question-card';
import { ContactForm } from './contact-form';
import { Results } from './results';
import {
  captureAttribution,
  clearState,
  getAnonymousId,
  loadState,
  newSubmissionId,
  saveCompletedResult,
  saveState,
  track,
} from '@/lib/scorecard-client';

type Phase = 'landing' | 'assessment' | 'contact' | 'submitting' | 'results' | 'error';

export function ScorecardExperience({ sampleMode = false }: { sampleMode?: boolean }) {
  const [phase, setPhase] = useState<Phase>('landing');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [booking, setBooking] = useState<{ configured: boolean; url: string | null }>({
    configured: false,
    url: null,
  });
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const contactRef = useRef<Contact | null>(null);
  const total = QUESTIONS.length;

  // --- Init: restore progress, or auto-run the deterministic sample ----------
  useEffect(() => {
    captureAttribution();
    if (sampleMode) {
      setSubmissionId('demo-marcus-johnson-0001');
      setAnswers(DEMO_ANSWERS);
      contactRef.current = DEMO_CONTACT;
      void submit(DEMO_CONTACT, DEMO_ANSWERS, 'demo-marcus-johnson-0001');
      return;
    }
    const persisted = loadState();
    if (persisted?.submissionId) {
      setSubmissionId(persisted.submissionId);
      setAnswers(persisted.answers ?? {});
      setIndex(Math.min(persisted.currentIndex ?? 0, total - 1));
      if (persisted.phase === 'assessment' || persisted.phase === 'contact') {
        setPhase(persisted.phase);
      }
    } else {
      setSubmissionId(newSubmissionId());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist assessment progress so a refresh doesn't lose it.
  useEffect(() => {
    if (!submissionId || phase === 'landing' || phase === 'results') return;
    saveState({ submissionId, answers, currentIndex: index, phase });
  }, [submissionId, answers, index, phase]);

  const start = useCallback(() => {
    const id = submissionId || newSubmissionId();
    setSubmissionId(id);
    setPhase('assessment');
    track('advisor_scorecard_started', { submissionId: id });
  }, [submissionId]);

  const question = QUESTIONS[index]!;

  const select = (optionIndex: number) =>
    setAnswers((p) => ({ ...p, [question.id]: optionIndex }));

  const onContinue = () => {
    track('advisor_scorecard_question_answered', {
      submissionId,
      currentQuestion: index + 1,
      section: SECTIONS[question.section].label,
    });
    if (index + 1 < total) setIndex(index + 1);
    else setPhase('contact');
  };

  const onBack = () => {
    if (index > 0) setIndex(index - 1);
    else setPhase('landing');
  };

  async function submit(contact: Contact, ans = answers, id = submissionId) {
    contactRef.current = contact;
    setPhase('submitting');
    setError(null);
    try {
      const res = await fetch('/api/scorecard/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: id,
          answers: ans,
          contact,
          attribution: captureAttribution(),
          anonymousId: getAnonymousId(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'submit_failed');
      setResult(json.result as ScorecardResult);
      setBooking(json.booking ?? { configured: false, url: null });
      setDemo(!!json.demo);
      setPhase('results');
      clearState();
      const r = json.result as ScorecardResult;
      // Hand the result to the personalized proposal page.
      saveCompletedResult({
        submissionId: id,
        result: r,
        contact,
        booking: json.booking ?? { configured: false, url: null },
      });
      track('advisor_scorecard_completed', {
        submissionId: id,
        score: r.total,
        scoreBand: r.band,
        primaryLeak: r.primaryLeak.label,
      });
      track('advisor_scorecard_results_viewed', { submissionId: id, score: r.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('error');
    }
  }

  const onBook = () => {
    track('advisor_scorecard_booking_clicked', {
      submissionId,
      score: result?.total,
      primaryLeak: result?.primaryLeak.label,
    });
    if (booking.url) window.open(booking.url, '_blank', 'noopener,noreferrer');
  };

  const onSaveReport = () => {
    if (!result || !contactRef.current) return;
    track('advisor_scorecard_report_saved', { submissionId, score: result.total });
    downloadReport(result, contactRef.current);
    setSaved(true);
  };

  const restart = () => {
    clearState();
    setAnswers({});
    setIndex(0);
    setResult(null);
    setSaved(false);
    setSubmissionId(newSubmissionId());
    setPhase('landing');
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPct =
    phase === 'assessment' ? (index / total) * 100 : phase === 'contact' ? 100 : (answeredCount / total) * 100;

  return (
    <div>
      {(phase === 'assessment' || phase === 'contact') && (
        <div className="mb-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-brand-blue transition-all duration-300"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'landing' && <Landing onStart={start} />}

      {phase === 'assessment' && (
        <Card className="p-5 sm:p-6">
          <QuestionCard
            question={question}
            index={index}
            total={total}
            selected={answers[question.id]}
            onSelect={select}
            onBack={onBack}
            onContinue={onContinue}
            canGoBack
          />
        </Card>
      )}

      {phase === 'contact' && (
        <Card className="p-5 sm:p-6">
          <button
            onClick={() => setPhase('assessment')}
            className="mb-3 text-sm text-slate-400 hover:text-slate-200"
          >
            ← Back
          </button>
          <ContactForm onSubmit={(c) => submit(c)} submitting={false} error={error} />
        </Card>
      )}

      {phase === 'submitting' && (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-blue" />
          <p className="text-sm text-slate-400">Calculating your Advisor Conversion Infrastructure Score…</p>
        </Card>
      )}

      {phase === 'results' && result && (
        <Results
          result={result}
          booking={booking}
          demo={demo}
          submissionId={submissionId}
          onBook={onBook}
          onSaveReport={onSaveReport}
          onRestart={restart}
          saved={saved}
        />
      )}

      {phase === 'error' && (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-red-300">We couldn’t calculate your score.</p>
          <p className="mt-1 text-sm text-slate-400">{error}</p>
          <button
            onClick={() => (contactRef.current ? submit(contactRef.current) : setPhase('contact'))}
            className="mt-4 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright"
          >
            Try again
          </button>
        </Card>
      )}
    </div>
  );
}

/** Client-side "Save My Report" — downloads a clean text summary. */
function downloadReport(result: ScorecardResult, contact: Contact) {
  const lines = [
    'ADVISOR CONVERSION INFRASTRUCTURE SCORE',
    '=======================================',
    `Name: ${contact.fullName}`,
    `Practice: ${contact.company}`,
    '',
    `Overall score: ${result.total} / 100 — ${result.band}`,
    `Primary conversion leak: ${result.primaryLeak.label}`,
    '',
    'Section scores:',
    ...result.sections.map((s) => `  - ${s.label}: ${s.earned}/${s.max}`),
    '',
    'Top findings:',
    ...result.findings.map((f, i) => `  ${i + 1}. ${f.prompt}\n     ${f.observedGap}`),
    '',
    `Recommended first fix: ${result.recommendedFirstFix}`,
    '',
    '30-day priority plan:',
    ...result.plan30Day.map((s, i) => `  ${i + 1}. ${s}`),
    '',
    'This is a marketing and sales process diagnostic. It does not provide financial, investment,',
    'legal, tax, or insurance-product advice.',
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'advisor-conversion-scorecard.txt';
  a.click();
  URL.revokeObjectURL(url);
}
