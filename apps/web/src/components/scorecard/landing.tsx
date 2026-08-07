'use client';

const BENEFITS = [
  'Identify your biggest conversion bottleneck',
  'Benchmark six parts of your prospect journey',
  'Get a prioritized first-fix recommendation',
  'Takes approximately 3–5 minutes',
];

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
        Advisor Conversion Infrastructure Score
      </span>

      <h1 className="mx-auto mt-5 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
        How Much Opportunity Is Leaking From Your Lead Process?
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
        Get your Advisor Conversion Infrastructure Score and see where prospects may be falling out
        between first contact and a qualified conversation.
      </p>

      <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-green/15 text-[11px] text-brand-green">
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>

      <button
        onClick={onStart}
        className="mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-brand-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-blue/20 transition-colors hover:bg-brand-bright focus-visible:outline-2"
      >
        Get My Conversion Score
      </button>

      <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-slate-500">
        This diagnostic evaluates your marketing and sales process. It does not evaluate investment
        performance or provide financial advice.
      </p>
    </div>
  );
}
