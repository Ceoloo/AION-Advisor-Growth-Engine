'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import {
  computeRoiBusinessCase,
  computeScorecard,
  generatePersonalizedProposal,
  DEMO_ANSWERS,
  DEMO_CONTACT,
  type Contact,
  type ScorecardResult,
} from '@aion/scorecard';
import { formatCurrency } from '@/lib/format';
import { attributionToSourceUtm, captureAttribution, loadCompletedResult, track } from '@/lib/scorecard-client';

interface Data {
  submissionId: string;
  result: ScorecardResult;
  contact: Contact;
  booking: { configured: boolean; url: string | null };
}

export function ProposalView({ sampleMode = false }: { sampleMode?: boolean }) {
  const [data, setData] = useState<Data | null | 'missing'>(null);

  useEffect(() => {
    if (sampleMode) {
      setData({
        submissionId: 'demo-marcus-johnson-0001',
        result: computeScorecard(DEMO_ANSWERS),
        contact: DEMO_CONTACT,
        booking: { configured: false, url: null },
      });
      return;
    }
    const persisted = loadCompletedResult();
    if (persisted?.result && persisted.contact) {
      setData({
        submissionId: persisted.submissionId,
        result: persisted.result as ScorecardResult,
        contact: persisted.contact as Contact,
        booking: persisted.booking ?? { configured: false, url: null },
      });
    } else {
      setData('missing');
    }
  }, [sampleMode]);

  const proposal = useMemo(() => {
    if (!data || data === 'missing') return null;
    const roi = computeRoiBusinessCase(data.contact.monthlyLeadVolume, data.result);
    return generatePersonalizedProposal(data.contact, data.result, roi);
  }, [data]);

  if (data === null) {
    return <Card className="p-8 text-center text-sm text-slate-400">Loading your plan…</Card>;
  }

  if (data === 'missing' || !proposal) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-white">No recent scorecard result found</p>
        <p className="mt-1 text-sm text-slate-400">Complete the scorecard to generate your personalized growth plan.</p>
        <Link
          href="/advisor-scorecard"
          className="mt-4 inline-flex rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright"
        >
          Take the scorecard →
        </Link>
      </Card>
    );
  }

  const { roi } = proposal;

  const onBook = () => {
    track('advisor_scorecard_booking_clicked', {
      submissionId: data.submissionId,
      score: data.result.total,
      primaryLeak: data.result.primaryLeak.label,
    });
    if (data.booking.url) window.open(data.booking.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/advisor-scorecard" className="text-xs text-slate-500 hover:text-slate-300">
          ← Back to results
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">{proposal.headline}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Prepared for {proposal.advisor} · {proposal.firm}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="blue">Score {proposal.scoreRecap.total}/100</Badge>
          <Badge tone="neutral">{proposal.scoreRecap.band}</Badge>
          <Badge tone="amber">Leak: {proposal.scoreRecap.primaryLeak}</Badge>
        </div>
      </div>

      {/* ROI business case */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-200">The opportunity (illustrative)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Based on {roi.assumedLeadVolume ? 'an assumed' : 'your'} {roi.monthlyLeadVolume} leads/month
          and editable assumptions. Fixing your {roi.primaryLeak} leak most directly improves your{' '}
          {roi.targetMetric === 'lead_to_appointment' ? 'lead → appointment' : 'appointment → client'} rate.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Est. added clients / yr" value={roi.uplift.additionalClientsPerYear.toString()} highlight />
          <Stat
            label="Est. annual upside"
            value={`${formatCurrency(roi.uplift.annualRevenueLow)}–${formatCurrency(roi.uplift.annualRevenueLikely)}`}
            highlight
          />
          <Stat
            label="Appointments / mo"
            value={`${roi.current.monthlyAppointments} → ${roi.projected.monthlyAppointments}`}
          />
        </div>

        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer">Assumptions (editable)</summary>
          <ul className="mt-2 space-y-1">
            <li>Avg. annual client value: {formatCurrency(roi.assumptions.avgClientAnnualValue)}</li>
            <li>Baseline lead → appointment: {Math.round(roi.assumptions.leadToAppointmentBaseline * 100)}%</li>
            <li>Baseline appointment → client: {Math.round(roi.assumptions.appointmentToClientBaseline * 100)}%</li>
            <li>Modeled uplift on the leak metric: {Math.round(roi.assumptions.leakUpliftFraction * 100)}%</li>
          </ul>
        </details>
        <p className="mt-2 text-[11px] text-slate-500">{roi.note}</p>
      </Card>

      {/* First fix */}
      <Card className="border-brand-blue/30 bg-brand-blue/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Where we’d start</p>
        <p className="mt-1 text-base font-semibold text-white">{proposal.recommendedFirstFix}</p>
      </Card>

      {/* Recommended plan */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Recommended plan</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <PlanCard plan={proposal.recommendedPlan} recommended />
          <PlanCard plan={proposal.anchorPlan} />
        </div>
        <p className="mt-3 text-sm text-slate-400">{proposal.planRationale}</p>
      </Card>

      {/* Next step */}
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-white">Your next step</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{proposal.nextStep}</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={onBook}
            className="w-full max-w-xs rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright"
          >
            Book My 15-Minute Advisor Growth Review
          </button>
          <Link
            href={`/advisor-scorecard/booked?submissionId=${encodeURIComponent(data.submissionId)}`}
            className="text-xs text-slate-500 underline-offset-2 hover:underline"
          >
            Already booked? Confirm it →
          </Link>
        </div>
      </Card>

      <div className="space-y-1 text-center text-[11px] text-slate-500">
        {proposal.disclaimers.map((d, i) => (
          <p key={i}>{d}</p>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${highlight ? 'text-brand-green' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function PlanCard({ plan, recommended }: { plan: { name: string; setup: number; monthly: number; tagline: string }; recommended?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${recommended ? 'border-brand-blue/40 bg-brand-blue/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{plan.name}</p>
        {recommended && <Badge tone="blue">Recommended</Badge>}
      </div>
      <p className="mt-1 text-lg font-semibold text-white">
        {formatCurrency(plan.setup)} <span className="text-xs font-normal text-slate-400">setup</span>
      </p>
      <p className="text-sm text-brand-green">
        {formatCurrency(plan.monthly)}
        <span className="text-xs text-slate-400"> / month</span>
      </p>
      <p className="mt-2 text-xs text-slate-400">{plan.tagline}</p>
    </div>
  );
}
