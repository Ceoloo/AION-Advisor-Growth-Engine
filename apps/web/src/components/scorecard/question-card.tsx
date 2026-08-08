'use client';

import { cn } from '@aion/ui';
import type { Question } from '@aion/scorecard';
import { SECTIONS } from '@aion/scorecard';

interface Props {
  question: Question;
  index: number; // 0-based
  total: number;
  selected: number | undefined;
  onSelect: (optionIndex: number) => void;
  onBack: () => void;
  onContinue: () => void;
  canGoBack: boolean;
}

export function QuestionCard({ question, index, total, selected, onSelect, onBack, onContinue, canGoBack }: Props) {
  const section = SECTIONS[question.section];
  const answered = selected != null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-brand-bright">{section.label}</span>
        <span className="tabular-nums text-slate-500">
          Question {index + 1} of {total}
        </span>
      </div>

      <fieldset>
        <legend className="text-lg font-semibold leading-snug text-white sm:text-xl">
          {question.prompt}
        </legend>

        <div className="mt-5 space-y-2.5" role="radiogroup" aria-label={question.prompt}>
          {question.options.map((opt, i) => {
            const isSel = selected === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isSel}
                onClick={() => onSelect(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  isSel
                    ? 'border-brand-blue bg-brand-blue/10 text-white'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                    isSel ? 'border-brand-blue bg-brand-blue' : 'border-white/25',
                  )}
                >
                  {isSel && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!answered}
          className="rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {index + 1 === total ? 'See my results' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
