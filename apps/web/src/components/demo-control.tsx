'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { JOURNEY, TOTAL_STAGES } from '@/lib/presentation';

interface State {
  currentStage: number;
  externalSendingEnabled: boolean;
  marcusSeeded: boolean;
  updatedAt: string;
}

export function DemoControl() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/demo-control');
    const json = await res.json();
    setState(json.state);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(body: unknown) {
    setBusy(true);
    try {
      const res = await fetch('/api/demo-control', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) setState(json.state);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current state */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-300">Current stage:</span>
          <Badge tone="blue">
            {state ? (state.currentStage === 0 ? 'Not started' : `Stage ${state.currentStage} / ${TOTAL_STAGES}`) : '…'}
          </Badge>
          <span className="text-sm text-slate-300">External sending:</span>
          <Badge tone={state?.externalSendingEnabled ? 'red' : 'green'}>
            {state?.externalSendingEnabled ? 'ENABLED' : 'DISABLED (safe)'}
          </Badge>
          <span className="text-sm text-slate-300">Marcus:</span>
          <Badge tone="green">{state?.marcusSeeded ? 'Seeded' : 'Missing'}</Badge>
        </div>
      </Card>

      {/* Primary actions */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => act({ type: 'reset_marcus' })}
            disabled={busy}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-60"
          >
            ↺ Reset Marcus
          </button>
          <button
            onClick={() => act({ type: 'set_external_sending', enabled: false })}
            disabled={busy}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            🔒 Disable external sending
          </button>
          <button
            onClick={() => act({ type: 'restore' })}
            disabled={busy}
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright disabled:opacity-60"
          >
            ⟳ Restore demo state
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          External sending is a no-op in demo mode regardless — the compliance layer blocks all real
          outbound. This control makes the safe state explicit for the presenter.
        </p>
      </Card>

      {/* Seed at stage */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Seed Marcus at a stage</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {JOURNEY.map((s) => (
            <button
              key={s.step}
              onClick={() => act({ type: 'seed_stage', stage: s.step })}
              disabled={busy}
              className={`rounded-lg border px-2 py-1.5 text-left text-xs disabled:opacity-60 ${
                state?.currentStage === s.step
                  ? 'border-brand-blue bg-brand-blue/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="font-semibold">{s.step}.</span> {s.title}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Link
            href={state && state.currentStage > 0 ? `/presentation/stage/${state.currentStage}` : '/presentation'}
            className="inline-flex rounded-lg bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Jump to current stage →
          </Link>
        </div>
      </Card>
    </div>
  );
}
