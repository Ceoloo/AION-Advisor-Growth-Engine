'use client';

import { useState } from 'react';
import { Card, ComplianceAlert } from '@aion/ui';

interface Brief {
  headline: string;
  contactSnapshot: string;
  talkingPoints: string[];
  likelyObjections: string[];
  recommendedProducts: string[];
  complianceReminders: string[];
}

export function AiBriefing({ leadId }: { leadId: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/advisor-brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Failed to generate');
      setBrief(json.data as Brief);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">AI Advisor Briefing</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-brand-blue px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-bright disabled:opacity-60"
        >
          {loading ? 'Generating…' : brief ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!brief && !error && (
        <p className="text-xs text-slate-500">
          Generate a call-prep brief from this lead&apos;s qualification and activity. Runs through the
          provider-agnostic AI gateway (mock provider by default).
        </p>
      )}

      {brief && (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-white">{brief.headline}</p>
          <p className="text-slate-400">{brief.contactSnapshot}</p>
          <Section title="Talking points" items={brief.talkingPoints} />
          <Section title="Likely objections" items={brief.likelyObjections} />
          <Section title="Recommended products" items={brief.recommendedProducts} />
          <ComplianceAlert>
            {brief.complianceReminders.join(' · ')} — Advisor review required before use with a client.
          </ComplianceAlert>
        </div>
      )}
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-slate-300">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
