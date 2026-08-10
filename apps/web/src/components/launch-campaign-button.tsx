'use client';

import { useState } from 'react';

type Result =
  | { ok: true; launched: true }
  | { ok: false; message: string; reasons: string[] };

/**
 * Attempts to launch a live campaign by calling the enforced server endpoint.
 * When the launch gate blocks it, the server's refusal is shown inline — there
 * is no client-side override. This is the demonstration that the gate is real.
 */
export function LaunchCampaignButton() {
  const [state, setState] = useState<'idle' | 'loading'>('idle');
  const [result, setResult] = useState<Result | null>(null);

  const attempt = async () => {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/campaigns/launch', { method: 'POST' });
      setResult((await res.json()) as Result);
    } catch {
      setResult({ ok: false, message: 'Request failed', reasons: ['Network error'] });
    } finally {
      setState('idle');
    }
  };

  return (
    <div>
      <button
        onClick={attempt}
        disabled={state === 'loading'}
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
      >
        {state === 'loading' ? 'Checking gate…' : 'Attempt to launch a live campaign'}
      </button>

      {result && result.ok && (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          ✓ Live campaign permitted — all gates passed.
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <p className="font-semibold">⛔ Live campaign blocked by the server.</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px] text-red-200/90">
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
