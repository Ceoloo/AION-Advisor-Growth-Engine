/**
 * ROI business case, structured around the AION measurement framework:
 *
 *   OBSERVED  → MODELED  → VERIFIED
 *
 *  - OBSERVED: facts we actually measured (the advisor's reported lead volume,
 *    and — for a live client — real booking rate and response time).
 *  - MODELED: an ILLUSTRATIVE projection of the upside from fixing the primary
 *    leak, computed from the observed inputs and editable assumptions. It is NOT
 *    a guarantee, not a projection of investment returns, and not financial
 *    advice — it estimates marketing/sales throughput only.
 *  - VERIFIED: actual attributed outcomes once the pilot runs (real appointments,
 *    opportunities, and revenue). Absent until there is real data; when present
 *    it supersedes the model.
 *
 * Keeping these tiers explicit is the guardrail: a modeled number can never be
 * presented as if it were measured or verified.
 */
import { round } from '@aion/shared';
import type { MeasurementTier } from '@aion/types';
import type { ScorecardResult } from './types.js';
import type { SectionId } from './sections.js';

export interface RoiAssumptions {
  /** Editable estimate of the annual value of one new client to the practice. */
  avgClientAnnualValue: number;
  /** Baseline share of leads that currently become appointments. */
  leadToAppointmentBaseline: number;
  /** Baseline share of appointments that currently become clients. */
  appointmentToClientBaseline: number;
  /** Relative uplift applied to the target metric when the leak is fixed. */
  leakUpliftFraction: number;
  /** Conservative multiplier for the low end of the range. */
  conservativeFactor: number;
}

export const DEFAULT_ROI_ASSUMPTIONS: RoiAssumptions = {
  avgClientAnnualValue: 3000,
  leadToAppointmentBaseline: 0.15,
  appointmentToClientBaseline: 0.25,
  leakUpliftFraction: 0.3,
  conservativeFactor: 0.5,
};

export const DEFAULT_ASSUMED_LEAD_VOLUME = 20;

export type TargetMetric = 'lead_to_appointment' | 'appointment_to_client';

/** Which funnel metric the primary leak most directly improves. */
const LEAK_TARGET: Record<SectionId, TargetMetric> = {
  acquisition: 'lead_to_appointment',
  speed_to_lead: 'lead_to_appointment',
  follow_up: 'lead_to_appointment',
  booking: 'lead_to_appointment',
  qualification: 'appointment_to_client',
  crm: 'appointment_to_client',
};

/** OBSERVED — facts actually measured. */
export interface RoiObserved {
  tier: 'observed';
  monthlyLeadVolume: number;
  /** Whether the lead volume was reported by the advisor or assumed as a default. */
  leadVolumeSource: 'reported' | 'assumed';
  /** Real lead→appointment (booking) rate, when known from live data. */
  bookingRate?: number;
  /** Real average first-response time in minutes, when known from live data. */
  responseTimeMinutes?: number;
}

/** MODELED — illustrative projection. Not a guarantee. */
export interface RoiModeled {
  tier: 'modeled';
  targetMetric: TargetMetric;
  assumptions: RoiAssumptions;
  current: { monthlyAppointments: number; monthlyClients: number; annualRevenue: number };
  projected: { monthlyAppointments: number; monthlyClients: number; annualRevenue: number };
  additionalAppointmentsPerMonth: number;
  additionalClientsPerMonth: number;
  additionalClientsPerYear: number;
  /** Headline modeled annual upside (likely case). */
  modeledAnnualUpside: number;
  annualRevenueLow: number;
  annualRevenueLikely: number;
}

/** VERIFIED — actual attributed outcomes (only when real pilot data exists). */
export interface RoiVerified {
  tier: 'verified';
  periodLabel: string;
  appointments: number;
  opportunities: number;
  revenueAttributed: number;
}

export interface RoiBusinessCase {
  framework: 'observed_modeled_verified';
  primaryLeak: string;
  observed: RoiObserved;
  modeled: RoiModeled;
  /** Present only when real attributed outcomes exist; null for a fresh prospect. */
  verified: RoiVerified | null;
  /** Convenience mirrors of observed lead volume (back-compat). */
  monthlyLeadVolume: number;
  assumedLeadVolume: boolean;
  targetMetric: TargetMetric;
  illustrative: true;
  note: string;
}

export interface RoiContext {
  /** Real booking rate / response time to record in the OBSERVED tier. */
  observed?: { bookingRate?: number; responseTimeMinutes?: number };
  /** Actual attributed outcomes to record in the VERIFIED tier. */
  verified?: Omit<RoiVerified, 'tier'>;
}

export function computeRoiBusinessCase(
  monthlyLeadVolume: number | undefined,
  result: ScorecardResult,
  overrides: Partial<RoiAssumptions> = {},
  context: RoiContext = {},
): RoiBusinessCase {
  const a: RoiAssumptions = { ...DEFAULT_ROI_ASSUMPTIONS, ...overrides };
  const assumedLeadVolume = monthlyLeadVolume == null || monthlyLeadVolume <= 0;
  const leads = assumedLeadVolume ? DEFAULT_ASSUMED_LEAD_VOLUME : monthlyLeadVolume!;

  const targetMetric = LEAK_TARGET[result.leakSection];
  const cap = 0.9; // never model a rate above 90%

  const l2a = a.leadToAppointmentBaseline;
  const a2c = a.appointmentToClientBaseline;

  const currentAppointments = leads * l2a;
  const currentClients = currentAppointments * a2c;

  // Apply the relative uplift to the metric the leak governs.
  const l2aP = targetMetric === 'lead_to_appointment' ? Math.min(l2a * (1 + a.leakUpliftFraction), cap) : l2a;
  const a2cP = targetMetric === 'appointment_to_client' ? Math.min(a2c * (1 + a.leakUpliftFraction), cap) : a2c;

  const projectedAppointments = leads * l2aP;
  const projectedClients = projectedAppointments * a2cP;

  const additionalAppointmentsPerMonth = Math.max(0, projectedAppointments - currentAppointments);
  const additionalClientsPerMonth = Math.max(0, projectedClients - currentClients);
  const additionalClientsPerYear = additionalClientsPerMonth * 12;
  const annualRevenueLikely = additionalClientsPerYear * a.avgClientAnnualValue;
  const annualRevenueLow = annualRevenueLikely * a.conservativeFactor;

  const observed: RoiObserved = {
    tier: 'observed',
    monthlyLeadVolume: leads,
    leadVolumeSource: assumedLeadVolume ? 'assumed' : 'reported',
    ...(context.observed?.bookingRate != null ? { bookingRate: context.observed.bookingRate } : {}),
    ...(context.observed?.responseTimeMinutes != null
      ? { responseTimeMinutes: context.observed.responseTimeMinutes }
      : {}),
  };

  const modeled: RoiModeled = {
    tier: 'modeled',
    targetMetric,
    assumptions: a,
    current: {
      monthlyAppointments: round(currentAppointments, 1),
      monthlyClients: round(currentClients, 2),
      annualRevenue: Math.round(currentClients * 12 * a.avgClientAnnualValue),
    },
    projected: {
      monthlyAppointments: round(projectedAppointments, 1),
      monthlyClients: round(projectedClients, 2),
      annualRevenue: Math.round(projectedClients * 12 * a.avgClientAnnualValue),
    },
    additionalAppointmentsPerMonth: round(additionalAppointmentsPerMonth, 1),
    additionalClientsPerMonth: round(additionalClientsPerMonth, 2),
    additionalClientsPerYear: round(additionalClientsPerYear, 1),
    modeledAnnualUpside: Math.round(annualRevenueLikely),
    annualRevenueLow: Math.round(annualRevenueLow),
    annualRevenueLikely: Math.round(annualRevenueLikely),
  };

  const verified: RoiVerified | null = context.verified
    ? { tier: 'verified', ...context.verified }
    : null;

  return {
    framework: 'observed_modeled_verified',
    primaryLeak: result.primaryLeak.label,
    observed,
    modeled,
    verified,
    monthlyLeadVolume: leads,
    assumedLeadVolume,
    targetMetric,
    illustrative: true,
    note:
      'The modeled figures are illustrative — based on your inputs and the editable assumptions ' +
      'shown. They model marketing and sales throughput only: not a guarantee, not a projection of ' +
      'investment returns, and not financial advice. Verified results replace the model once the pilot runs.',
  };
}

/** Human-readable labels + one-line descriptions for each measurement tier. */
export const MEASUREMENT_TIER_META: Record<MeasurementTier, { label: string; description: string }> = {
  observed: { label: 'Observed', description: 'Actually measured from your inputs and data.' },
  modeled: { label: 'Modeled', description: 'Illustrative projection from assumptions — not a guarantee.' },
  verified: { label: 'Verified', description: 'Actual attributed outcomes from the live pilot.' },
};
