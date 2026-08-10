/**
 * The revenue funnel + KPI layer.
 *
 * Ben doesn't care that we built an 18-question quiz — he cares whether he got
 * more qualified opportunities and revenue. So this computes the full funnel he
 * measures against:
 *
 *   Traffic → Leads → Qualified → Appointments → Showed → Consultations →
 *   Opportunities → Clients → Verified Revenue
 *
 * plus the conversion rates between stages, operational metrics (response time,
 * cost per lead / qualified lead), source & campaign conversion, pipeline value,
 * verified revenue — and, most importantly, a BEFORE-vs-AFTER comparison against
 * a recorded pre-AION baseline. That comparison is what becomes the testimonial.
 *
 * Pure functions over plain arrays, so identical math runs on demo seed data and
 * on live query results.
 */
import type {
  Appointment,
  FunnelSnapshot,
  FunnelStageKey,
  Lead,
  Opportunity,
  Policy,
} from '@aion/types';
import { round } from '@aion/shared';
import type { Campaign } from './metrics.js';

/** Campaign row with top-of-funnel traffic for source/campaign math. */
export interface CampaignWithTraffic extends Campaign {
  channel?: string;
  visits?: number;
}

export interface FunnelInputs {
  leads: Lead[];
  appointments: Appointment[];
  opportunities: Opportunity[];
  policies: Policy[];
  campaigns: CampaignWithTraffic[];
  /** Average first-response time in minutes (from SLA tracking / cadence). */
  responseTimeMinutes?: number;
  periodLabel?: string;
}

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  value: number;
  isCurrency: boolean;
  /** Conversion from the previous stage (0–1), or null for the first stage. */
  conversionFromPrev: number | null;
}

export interface ConversionRates {
  leadToQualified: number;
  qualifiedToBooked: number;
  bookedToShow: number;
  showToNextStep: number;
  leadToClient: number;
}

export interface SourceConversion {
  source: string;
  leads: number;
  qualified: number;
  clients: number;
  leadToQualified: number;
  leadToClient: number;
}

export interface CampaignConversion {
  id: string;
  name: string;
  channel: string;
  spend: number;
  visits: number;
  leads: number;
  visitToLead: number;
  costPerLead: number;
}

export interface FunnelReport {
  snapshot: FunnelSnapshot;
  stages: FunnelStage[];
  conversions: ConversionRates;
  responseTimeMinutes: number;
  totalSpend: number;
  costPerLead: number;
  costPerQualifiedLead: number;
  pipelineValue: number;
  verifiedRevenue: number;
  sources: SourceConversion[];
  campaigns: CampaignConversion[];
}

export const STAGE_LABELS: Record<FunnelStageKey, string> = {
  traffic: 'Traffic',
  leads: 'Leads',
  qualified: 'Qualified',
  appointments: 'Appointments',
  showed: 'Showed',
  consultations: 'Consultations',
  opportunities: 'Opportunities',
  clients: 'Clients',
  verifiedRevenue: 'Verified Revenue',
};

const rate = (num: number, den: number): number => (den > 0 ? round(num / den, 4) : 0);
const QUALIFIED = new Set(['qualified', 'high_priority']);

/** Compute the full funnel report ("AFTER AION" when run on live pilot data). */
export function computeFunnel(input: FunnelInputs): FunnelReport {
  const { leads, appointments, opportunities, policies, campaigns } = input;

  // --- Stage sets (each downstream stage ⊆ the previous, so the funnel is a
  //     clean monotonic chain rather than loose independent counts). ----------
  const traffic = campaigns.reduce((s, c) => s + (c.visits ?? 0), 0);

  const leadIds = new Set(leads.map((l) => l.id));
  const qualifiedIds = new Set(leads.filter((l) => QUALIFIED.has(l.qualificationStatus)).map((l) => l.id));

  const bookedIds = new Set(
    appointments.filter((a) => a.status !== 'cancelled').map((a) => a.leadId).filter((id) => leadIds.has(id)),
  );
  const showedIds = new Set(
    appointments.filter((a) => a.status === 'completed').map((a) => a.leadId).filter((id) => bookedIds.has(id)),
  );

  const anyOppIds = new Set(opportunities.map((o) => o.leadId));
  const activeOppIds = new Set(
    opportunities.filter((o) => o.status === 'open' || o.status === 'won').map((o) => o.leadId),
  );
  const policyClientIds = new Set(
    policies.filter((p) => p.status === 'active' || p.status === 'renewed').map((p) => p.leadId),
  );
  const clientLeadIds = new Set(
    leads.filter((l) => l.status === 'client').map((l) => l.id),
  );
  for (const id of policyClientIds) clientLeadIds.add(id);

  // Consultation = a lead that showed AND a deal was discussed (any opp/close).
  const consultationIds = [...showedIds].filter(
    (id) => anyOppIds.has(id) || clientLeadIds.has(id),
  );
  // Opportunity = showed with an active/won deal (lost/abandoned drop out).
  const opportunityIds = consultationIds.filter(
    (id) => activeOppIds.has(id) || clientLeadIds.has(id),
  );
  // Client = an opportunity that closed.
  const clientIds = opportunityIds.filter((id) => clientLeadIds.has(id));

  const verifiedRevenue = round(
    policies
      .filter((p) => p.status === 'active' || p.status === 'renewed')
      .reduce((s, p) => s + p.premium, 0),
  );
  const pipelineValue = round(
    opportunities.filter((o) => o.status === 'open').reduce((s, o) => s + o.monetaryValue, 0),
  );

  const counts: Record<FunnelStageKey, number> = {
    traffic,
    leads: leads.length,
    qualified: qualifiedIds.size,
    appointments: bookedIds.size,
    showed: showedIds.size,
    consultations: consultationIds.length,
    opportunities: opportunityIds.length,
    clients: clientIds.length,
    verifiedRevenue,
  };

  const order: FunnelStageKey[] = [
    'traffic',
    'leads',
    'qualified',
    'appointments',
    'showed',
    'consultations',
    'opportunities',
    'clients',
    'verifiedRevenue',
  ];
  const stages: FunnelStage[] = order.map((key, i) => {
    const prevKey = order[i - 1];
    // Verified revenue is a dollar figure, not a countable stage — no ratio.
    const conversionFromPrev =
      i === 0 || key === 'verifiedRevenue' || !prevKey ? null : rate(counts[key], counts[prevKey]);
    return {
      key,
      label: STAGE_LABELS[key],
      value: counts[key],
      isCurrency: key === 'verifiedRevenue',
      conversionFromPrev,
    };
  });

  const conversions: ConversionRates = {
    leadToQualified: rate(counts.qualified, counts.leads),
    qualifiedToBooked: rate(counts.appointments, counts.qualified),
    bookedToShow: rate(counts.showed, counts.appointments),
    showToNextStep: rate(counts.consultations, counts.showed),
    leadToClient: rate(counts.clients, counts.leads),
  };

  const totalSpend = round(campaigns.reduce((s, c) => s + c.spend, 0));
  const costPerLead = counts.leads > 0 ? round(totalSpend / counts.leads) : 0;
  const costPerQualifiedLead = counts.qualified > 0 ? round(totalSpend / counts.qualified) : 0;
  const responseTimeMinutes = input.responseTimeMinutes ?? 0;

  return {
    snapshot: {
      periodLabel: input.periodLabel ?? 'Pilot to date (with AION)',
      traffic: counts.traffic,
      leads: counts.leads,
      qualified: counts.qualified,
      appointments: counts.appointments,
      showed: counts.showed,
      consultations: counts.consultations,
      opportunities: counts.opportunities,
      clients: counts.clients,
      verifiedRevenue,
      spend: totalSpend,
      responseTimeMinutes,
    },
    stages,
    conversions,
    responseTimeMinutes,
    totalSpend,
    costPerLead,
    costPerQualifiedLead,
    pipelineValue,
    verifiedRevenue,
    sources: computeSourceConversion(leads),
    campaigns: computeCampaignConversion(campaigns),
  };
}

function computeSourceConversion(leads: Lead[]): SourceConversion[] {
  const by = new Map<string, { leads: number; qualified: number; clients: number }>();
  for (const l of leads) {
    const src = (l.source ?? 'unknown').toString();
    const row = by.get(src) ?? { leads: 0, qualified: 0, clients: 0 };
    row.leads += 1;
    if (QUALIFIED.has(l.qualificationStatus)) row.qualified += 1;
    if (l.status === 'client') row.clients += 1;
    by.set(src, row);
  }
  return [...by.entries()]
    .map(([source, r]) => ({
      source,
      leads: r.leads,
      qualified: r.qualified,
      clients: r.clients,
      leadToQualified: rate(r.qualified, r.leads),
      leadToClient: rate(r.clients, r.leads),
    }))
    .sort((a, b) => b.leads - a.leads);
}

function computeCampaignConversion(campaigns: CampaignWithTraffic[]): CampaignConversion[] {
  return campaigns
    .map((c) => {
      const visits = c.visits ?? 0;
      const leads = c.leadsGenerated;
      return {
        id: c.id,
        name: c.name,
        channel: c.channel ?? 'other',
        spend: c.spend,
        visits,
        leads,
        visitToLead: rate(leads, visits),
        costPerLead: leads > 0 ? round(c.spend / leads) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);
}

// --- Baseline (BEFORE AION) vs Pilot (AFTER AION) comparison -----------------

export interface StageDelta {
  key: FunnelStageKey;
  label: string;
  before: number;
  after: number;
  delta: number;
  /** Relative lift (after/before − 1), or null when before is 0. */
  liftPct: number | null;
  isCurrency: boolean;
}

export interface RateDelta {
  key: string;
  label: string;
  before: number;
  after: number;
  /** Percentage-point change (after − before). */
  deltaPoints: number;
}

export interface FunnelComparison {
  baseline: FunnelSnapshot;
  pilot: FunnelSnapshot;
  stages: StageDelta[];
  rates: RateDelta[];
  responseTime: { before: number; after: number } | null;
}

const snapRate = (s: FunnelSnapshot, num: FunnelStageKey, den: FunnelStageKey): number =>
  rate(s[num] as number, s[den] as number);

/** Compare a recorded pre-AION baseline against the current pilot snapshot. */
export function compareFunnel(baseline: FunnelSnapshot, pilot: FunnelSnapshot): FunnelComparison {
  const keys: FunnelStageKey[] = [
    'traffic',
    'leads',
    'qualified',
    'appointments',
    'showed',
    'consultations',
    'opportunities',
    'clients',
    'verifiedRevenue',
  ];
  const stages: StageDelta[] = keys.map((key) => {
    const before = baseline[key] as number;
    const after = pilot[key] as number;
    return {
      key,
      label: STAGE_LABELS[key],
      before,
      after,
      delta: round(after - before),
      liftPct: before > 0 ? round((after - before) / before, 4) : null,
      isCurrency: key === 'verifiedRevenue',
    };
  });

  const rates: RateDelta[] = [
    {
      key: 'leadToQualified',
      label: 'Lead → Qualified',
      before: snapRate(baseline, 'qualified', 'leads'),
      after: snapRate(pilot, 'qualified', 'leads'),
      deltaPoints: 0,
    },
    {
      key: 'qualifiedToBooked',
      label: 'Qualified → Booked',
      before: snapRate(baseline, 'appointments', 'qualified'),
      after: snapRate(pilot, 'appointments', 'qualified'),
      deltaPoints: 0,
    },
    {
      key: 'bookedToShow',
      label: 'Booked → Show',
      before: snapRate(baseline, 'showed', 'appointments'),
      after: snapRate(pilot, 'showed', 'appointments'),
      deltaPoints: 0,
    },
    {
      key: 'showToNextStep',
      label: 'Show → Next step',
      before: snapRate(baseline, 'consultations', 'showed'),
      after: snapRate(pilot, 'consultations', 'showed'),
      deltaPoints: 0,
    },
    {
      key: 'leadToClient',
      label: 'Lead → Client',
      before: snapRate(baseline, 'clients', 'leads'),
      after: snapRate(pilot, 'clients', 'leads'),
      deltaPoints: 0,
    },
  ].map((r) => ({ ...r, deltaPoints: round(r.after - r.before, 4) }));

  const responseTime =
    baseline.responseTimeMinutes != null && pilot.responseTimeMinutes != null
      ? { before: baseline.responseTimeMinutes, after: pilot.responseTimeMinutes }
      : null;

  return { baseline, pilot, stages, rates, responseTime };
}
