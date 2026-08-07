'use client';

import { useState } from 'react';
import type { Contact, GrowthPriority } from '@aion/scorecard';

const GROWTH_PRIORITIES: GrowthPriority[] = ['Immediate', '30 Days', '60–90 Days', 'Exploring'];

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-blue';
const labelCls = 'mb-1 block text-xs font-medium text-slate-400';

export function ContactForm({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (contact: Contact) => void;
  submitting: boolean;
  error?: string | null;
}) {
  const [v, setV] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    role: '',
    monthlyLeadVolume: '',
    primaryLeadSources: '',
    currentCrm: '',
    growthPriority: '' as '' | GrowthPriority,
    consentToFollowUp: false,
  });
  const [touched, setTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
  const valid = v.fullName.trim() && emailValid && v.company.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      company: v.company.trim(),
      phone: v.phone.trim() || undefined,
      role: v.role.trim() || undefined,
      monthlyLeadVolume: v.monthlyLeadVolume ? Number(v.monthlyLeadVolume) : undefined,
      primaryLeadSources: v.primaryLeadSources.trim() || undefined,
      currentCrm: v.currentCrm.trim() || undefined,
      growthPriority: v.growthPriority || undefined,
      consentToFollowUp: v.consentToFollowUp,
    });
  }

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="text-xl font-semibold text-white">Where should we send your results?</h2>
      <p className="mt-1 text-sm text-slate-400">
        Your personalized report is ready. Add your details to reveal it.
      </p>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="fullName">
            Full name <span className="text-brand-bright">*</span>
          </label>
          <input id="fullName" className={inputCls} value={v.fullName} onChange={set('fullName')} autoComplete="name" />
          {touched && !v.fullName.trim() && <p className="mt-1 text-xs text-red-400">Name is required.</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="email">
            Work email <span className="text-brand-bright">*</span>
          </label>
          <input id="email" type="email" className={inputCls} value={v.email} onChange={set('email')} autoComplete="email" />
          {touched && !emailValid && <p className="mt-1 text-xs text-red-400">A valid email is required.</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="company">
            Company / practice <span className="text-brand-bright">*</span>
          </label>
          <input id="company" className={inputCls} value={v.company} onChange={set('company')} autoComplete="organization" />
          {touched && !v.company.trim() && <p className="mt-1 text-xs text-red-400">Company is required.</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="phone">Phone</label>
          <input id="phone" className={inputCls} value={v.phone} onChange={set('phone')} autoComplete="tel" />
        </div>
        <div>
          <label className={labelCls} htmlFor="role">Role</label>
          <input id="role" className={inputCls} value={v.role} onChange={set('role')} placeholder="Founder / Advisor" />
        </div>
        <div>
          <label className={labelCls} htmlFor="mlv">Monthly lead volume</label>
          <input id="mlv" type="number" min={0} className={inputCls} value={v.monthlyLeadVolume} onChange={set('monthlyLeadVolume')} placeholder="25" />
        </div>
        <div>
          <label className={labelCls} htmlFor="crm">Current CRM</label>
          <input id="crm" className={inputCls} value={v.currentCrm} onChange={set('currentCrm')} placeholder="HubSpot, GoHighLevel…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="sources">Primary lead sources</label>
          <input id="sources" className={inputCls} value={v.primaryLeadSources} onChange={set('primaryLeadSources')} placeholder="Referrals, LinkedIn, Webinars…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="priority">Growth priority</label>
          <select id="priority" className={inputCls} value={v.growthPriority} onChange={set('growthPriority')}>
            <option value="" className="bg-navy">Select…</option>
            {GROWTH_PRIORITIES.map((g) => (
              <option key={g} value={g} className="bg-navy">{g}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={v.consentToFollowUp}
          onChange={(e) => setV((p) => ({ ...p, consentToFollowUp: e.target.checked }))}
          className="mt-0.5 h-4 w-4 accent-brand-blue"
        />
        <span>
          It’s okay to follow up with me about my results and how AION could help. (Optional — your
          report is shown either way.)
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-xl bg-brand-blue px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-bright disabled:opacity-60"
      >
        {submitting ? 'Calculating your score…' : 'Reveal My Conversion Score'}
      </button>
    </form>
  );
}
