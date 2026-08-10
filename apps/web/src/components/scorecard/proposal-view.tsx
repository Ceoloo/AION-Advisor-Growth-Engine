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
import { MeasurementLegend, TierChip, TIER_STYLE } from '@/components/scorecard/measurement-tier';

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

      {/* ROI business case — Observed → Modeled → Verified */}
      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-200">The opportunity</h3>
          <MeasurementLegend />
        </div>

        {/* OBSERVED — measured facts */}
        <div className={`mt-4 rounded-xl border p-4 ${TIER_STYLE.observed.card}`}>
          <div className="mb-2 flex items-center gap-2">
            <TierChip tier="observed" />
            <span className="text-xs text-slate-400">What we measured</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TierStat
              label="Lead volume / mo"
              value={roi.observed.monthlyLeadVolume.toString()}
              sub={roi.observed.leadVolumeSource === 'reported' ? 'you reported' : 'assumed default'}
              tier="observed"
            />
            <TierStat
              label="Booking rate"
              value={roi.observed.bookingRate != null ? `${Math.round(roi.observed.bookingRate * 100)}%` : '—'}
              sub={roi.observed.bookingRate != null ? 'measured' : 'measured during pilot'}
              tier="observed"
            />
            <TierStat
              label="Response time"
              value={roi.observed.responseTimeMinutes != null ? `${roi.observed.responseTimeMinutes} min` : '—'}
              sub={roi.observed.responseTimeMinutes != null ? 'measured' : 'measured during pilot'}
              tier="observed"
            />
          </div>
        </div>

        {/* MODELED — illustrative projection */}
        <div className={`mt-3 rounded-xl border p-4 ${TIER_STYLE.modeled.card}`}>
          <div className="mb-2 flex items-center gap-2">
            <TierChip tier="modeled" />
            <span className="text-xs text-slate-400">
              Illustrative — fixing your {roi.primaryLeak} leak improves your{' '}
              {roi.targetMetric === 'lead_to_appointment' ? 'lead → appointment' : 'appointment → client'} rate
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TierStat
              label="Added appts / mo"
              value={`+${roi.modeled.additionalAppointmentsPerMonth}`}
              sub="modeled"
              tier="modeled"
            />
            <TierStat
              label="Added clients / yr"
              value={`+${roi.modeled.additionalClientsPerYear}`}
              sub="modeled"
              tier="modeled"
            />
            <TierStat
              label="Modeled annual upside"
              value={`${formatCurrency(roi.modeled.annualRevenueLow)}–${formatCurrency(roi.modeled.annualRevenueLikely)}`}
              sub="range, not a guarantee"
              tier="modeled"
            />
          </div>
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer">Assumptions (editable)</summary>
            <ul className="mt-2 space-y-1">
              <li>Avg. annual client value: {formatCurrency(roi.modeled.assumptions.avgClientAnnualValue)}</li>
              <li>Baseline lead → appointment: {Math.round(roi.modeled.assumptions.leadToAppointmentBaseline * 100)}%</li>
              <li>Baseline appointment → client: {Math.round(roi.modeled.assumptions.appointmentToClientBaseline * 100)}%</li>
              <li>Modeled uplift on the leak metric: {Math.round(roi.modeled.assumptions.leakUpliftFraction * 100)}%</li>
            </ul>
          </details>
        </div>

        {/* VERIFIED — actual outcomes (or pending) */}
        <div className={`mt-3 rounded-xl border p-4 ${TIER_STYLE.verified.card}`}>
          <div className="mb-2 flex items-center gap-2">
            <TierChip tier="verified" />
            <span className="text-xs text-slate-400">Actual attributed outcomes</span>
          </div>
          {roi.verified ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <TierStat label="Appointments" value={roi.verified.appointments.toString()} sub={roi.verified.periodLabel} tier="verified" />
              <TierStat label="Opportunities" value={roi.verified.opportunities.toString()} sub={roi.verified.periodLabel} tier="verified" />
              <TierStat label="Revenue attributed" value={formatCurrency(roi.verified.revenueAttributed)} sub={roi.verified.periodLabel} tier="verified" />
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Populated during your pilot from real appointments, opportunities, and attributed revenue —
              measured on the dashboard, not modeled here. Verified results replace the model above.
            </p>
          )}
        </div>

        <p className="mt-3 text-[11px] text-slate-500">{roi.note}</p>
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

function TierStat({
  label,
  value,
  sub,
  tier,
}: {
  label: string;
  value: string;
  sub?: string;
  tier: 'observed' | 'modeled' | 'verified';
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${TIER_STYLE[tier].accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
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
