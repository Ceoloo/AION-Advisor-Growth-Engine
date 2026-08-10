'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@aion/ui';

/** The eight launch approvals (kept in sync with @aion/types LAUNCH_APPROVAL_ITEMS). */
const APPROVAL_ITEMS = [
  ['branding', 'Branding'],
  ['biography', 'Biography'],
  ['licensing', 'Licensing'],
  ['disclosure', 'Disclosure'],
  ['messaging', 'Messaging'],
  ['data_handling', 'Data handling'],
  ['crm', 'CRM'],
  ['calendar', 'Calendar'],
] as const;

const STEPS = [
  'Create Client',
  'Select Vertical',
  'Configure ICP',
  'Configure Offer',
  'Configure Scorecard',
  'Configure GHL',
  'Configure Compliance',
  'Launch',
];

interface Draft {
  clientId: string;
  displayName: string;
  advisorName: string;
  advisorTitle: string;
  advisorBio: string;
  vertical: 'financial_advisor' | 'health_insurance';
  primaryAudience: string;
  planningAreas: string;
  licensedStates: string;
  serviceArea: string;
  bookingUrl: string;
  leadSources: string;
  scorecardEnabled: boolean;
  crmProvider: 'gohighlevel' | 'airtable' | 'none';
  calendarProvider: 'native' | 'gohighlevel' | 'calendly' | 'external';
  approvedBy: string;
  approvals: Record<string, boolean>;
}

// A realistic example so the flow is quick to walk through.
const INITIAL: Draft = {
  clientId: 'david-kim',
  displayName: 'David Kim — Retirement Income Planning',
  advisorName: 'David Kim',
  advisorTitle: 'Retirement Income Advisor',
  advisorBio: 'David helps pre-retirees build durable income plans and protect against longevity risk.',
  vertical: 'financial_advisor',
  primaryAudience: 'Pre-retirees (55–65) with $250k+ in investable assets',
  planningAreas: 'Retirement income, Social Security timing, Tax-efficient withdrawals',
  licensedStates: 'CA, NV, OR',
  serviceArea: 'Bay Area + remote across CA/NV/OR',
  bookingUrl: 'https://cal.com/david-kim/retirement-review',
  leadSources: 'Referral, Webinar, Landing page',
  scorecardEnabled: true,
  crmProvider: 'gohighlevel',
  calendarProvider: 'native',
  approvedBy: '',
  approvals: {},
};

type Result =
  | { ok: true; valid: true; config: Record<string, unknown>; launch: { eligible: boolean; approvedCritical: number; totalCritical: number; missing: string[] }; scorecardEnabled: boolean }
  | { ok: true; valid: false; issues: { path: string; message: string }[] }
  | { ok: false };

const csv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(INITIAL);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggleApproval = (k: string) => setD((p) => ({ ...p, approvals: { ...p.approvals, [k]: !p.approvals[k] } }));

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/clients/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...d,
          planningAreas: csv(d.planningAreas),
          licensedStates: csv(d.licensedStates).map((s) => s.toUpperCase()),
          leadSources: csv(d.leadSources),
        }),
      });
      setResult((await res.json()) as Result);
    } catch {
      setResult({ ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Stepper */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              i === step
                ? 'bg-brand-blue text-white'
                : i < step
                  ? 'bg-emerald-500/15 text-emerald-200'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <Card className="p-5">
        {step === 0 && (
          <Section title="Create Client" hint="Identity for the new advisor tenant.">
            <Field label="Client ID (slug)"><Input value={d.clientId} onChange={(v) => set('clientId', v)} placeholder="david-kim" /></Field>
            <Field label="Practice display name"><Input value={d.displayName} onChange={(v) => set('displayName', v)} /></Field>
            <Field label="Advisor name"><Input value={d.advisorName} onChange={(v) => set('advisorName', v)} /></Field>
            <Field label="Advisor title"><Input value={d.advisorTitle} onChange={(v) => set('advisorTitle', v)} /></Field>
            <Field label="Bio"><Textarea value={d.advisorBio} onChange={(v) => set('advisorBio', v)} /></Field>
          </Section>
        )}

        {step === 1 && (
          <Section title="Select Vertical" hint="Drives pipeline templates, cadence defaults, and copy framing.">
            <div className="grid gap-3 sm:grid-cols-2">
              {(['financial_advisor', 'health_insurance'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => set('vertical', v)}
                  className={`rounded-xl border p-4 text-left ${d.vertical === v ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                >
                  <p className="text-sm font-semibold text-white">
                    {v === 'financial_advisor' ? 'Financial Advisor' : 'Health Insurance'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {v === 'financial_advisor' ? 'Protection & planning funnel' : 'Medicare / coverage funnel'}
                  </p>
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Configure ICP" hint="Who the practice serves.">
            <Field label="Primary audience"><Input value={d.primaryAudience} onChange={(v) => set('primaryAudience', v)} /></Field>
            <Field label="Planning areas (comma-separated)"><Input value={d.planningAreas} onChange={(v) => set('planningAreas', v)} /></Field>
            <Field label="Licensed states (comma-separated)"><Input value={d.licensedStates} onChange={(v) => set('licensedStates', v)} placeholder="CA, NV, OR" /></Field>
            <Field label="Service area"><Input value={d.serviceArea} onChange={(v) => set('serviceArea', v)} /></Field>
          </Section>
        )}

        {step === 3 && (
          <Section title="Configure Offer" hint="Booking + lead sources. Follow-up cadence defaults by vertical.">
            <Field label="Booking URL"><Input value={d.bookingUrl} onChange={(v) => set('bookingUrl', v)} /></Field>
            <Field label="Lead sources (comma-separated)"><Input value={d.leadSources} onChange={(v) => set('leadSources', v)} /></Field>
          </Section>
        )}

        {step === 4 && (
          <Section title="Configure Scorecard" hint="The Advisor Conversion Scorecard funnel for this tenant.">
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <input type="checkbox" checked={d.scorecardEnabled} onChange={(e) => set('scorecardEnabled', e.target.checked)} className="h-4 w-4 accent-brand-blue" />
              <div>
                <p className="text-sm font-medium text-white">Enable the Advisor Conversion Scorecard</p>
                <p className="text-xs text-slate-400">Deterministic 18-question assessment → intent nurture → discovery booking.</p>
              </div>
            </label>
          </Section>
        )}

        {step === 5 && (
          <Section title="Configure GHL" hint="CRM + calendar backends.">
            <Field label="CRM provider">
              <Select value={d.crmProvider} onChange={(v) => set('crmProvider', v as Draft['crmProvider'])} options={['gohighlevel', 'airtable', 'none']} />
            </Field>
            <Field label="Calendar provider">
              <Select value={d.calendarProvider} onChange={(v) => set('calendarProvider', v as Draft['calendarProvider'])} options={['native', 'gohighlevel', 'calendly', 'external']} />
            </Field>
          </Section>
        )}

        {step === 6 && (
          <Section title="Configure Compliance" hint="Every critical approval must be signed off before launch.">
            <Field label="Approver name"><Input value={d.approvedBy} onChange={(v) => set('approvedBy', v)} placeholder="Compliance officer" /></Field>
            <div className="grid gap-2 sm:grid-cols-2">
              {APPROVAL_ITEMS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-sm">
                  <input type="checkbox" checked={!!d.approvals[key]} onChange={() => toggleApproval(key)} className="h-4 w-4 accent-brand-blue" />
                  <span className={d.approvals[key] ? 'text-emerald-200' : 'text-slate-300'}>{label} approved</span>
                </label>
              ))}
            </div>
          </Section>
        )}

        {step === 7 && (
          <Section title="Launch" hint="Validate the assembled tenant configuration and check launch readiness.">
            <button onClick={submit} disabled={loading} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60">
              {loading ? 'Validating…' : 'Validate & preview client'}
            </button>
            {result && <LaunchResult result={result} />}
          </Section>
        )}

        {/* Nav */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40">
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15">
              Next →
            </button>
          ) : (
            <Link href="/client" className="text-xs text-slate-500 hover:text-slate-300">
              View registered clients →
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}

function LaunchResult({ result }: { result: Result }) {
  if (!result.ok) return <p className="mt-4 text-sm text-red-300">Request failed.</p>;
  if (!result.valid) {
    return (
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <p className="text-sm font-semibold text-amber-200">Configuration incomplete</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px] text-amber-100/90">
          {result.issues.map((i) => (
            <li key={i.path}>
              <code className="text-amber-200">{i.path}</code>: {i.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <p className="text-sm font-semibold text-emerald-200">✓ Valid tenant configuration</p>
        <p className="mt-1 text-xs text-slate-300">
          This is a working client definition — no code, no new app. It passes the same schema every
          registered client passes.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
        <span className="text-slate-300">Launch readiness</span>
        {result.launch.eligible ? (
          <Badge tone="green">Launch eligible</Badge>
        ) : (
          <Badge tone="amber">
            {result.launch.approvedCritical}/{result.launch.totalCritical} approvals — pending
          </Badge>
        )}
      </div>
      {!result.launch.eligible && result.launch.missing.length > 0 && (
        <p className="text-xs text-slate-500">Still needed: {result.launch.missing.join(', ')}.</p>
      )}
      <p className="text-[11px] text-slate-500">
        Preview only — the client registry is code-defined in this build. Registering the config adds
        the tenant to the same engine (Ben is Client Zero).
      </p>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mb-4 text-xs text-slate-500">{hint}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-blue/50 focus:outline-none"
    />
  );
}
function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      rows={2}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-brand-blue/50 focus:outline-none"
    />
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-brand-blue/50 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-navy">
          {o}
        </option>
      ))}
    </select>
  );
}
