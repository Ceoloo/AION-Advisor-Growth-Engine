/**
 * ROI business case. Deterministic and ILLUSTRATIVE — it models the advisor's
 * own inputs against editable assumptions to size the opportunity of fixing the
 * primary conversion leak. It is NOT a guarantee, a projection of investment
 * returns, or financial advice; it estimates marketing/sales throughput only.
 */
import { round } from '@aion/shared';
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

type TargetMetric = 'lead_to_appointment' | 'appointment_to_client';

/** Which funnel metric the primary leak most directly improves. */
const LEAK_TARGET: Record<SectionId, TargetMetric> = {
  acquisition: 'lead_to_appointment',
  speed_to_lead: 'lead_to_appointment',
  follow_up: 'lead_to_appointment',
  booking: 'lead_to_appointment',
  qualification: 'appointment_to_client',
  crm: 'appointment_to_client',
};

export interface RoiBusinessCase {
  monthlyLeadVolume: number;
  assumedLeadVolume: boolean;
  primaryLeak: string;
  targetMetric: TargetMetric;
  assumptions: RoiAssumptions;
  current: { monthlyAppointments: number; monthlyClients: number; annualRevenue: number };
  projected: { monthlyAppointments: number; monthlyClients: number; annualRevenue: number };
  uplift: {
    additionalClientsPerMonth: number;
    additionalClientsPerYear: number;
    annualRevenueLow: number;
    annualRevenueLikely: number;
  };
  illustrative: true;
  note: string;
}

export function computeRoiBusinessCase(
  monthlyLeadVolume: number | undefined,
  result: ScorecardResult,
  overrides: Partial<RoiAssumptions> = {},
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

  const additionalClientsPerMonth = Math.max(0, projectedClients - currentClients);
  const additionalClientsPerYear = additionalClientsPerMonth * 12;
  const annualRevenueLikely = additionalClientsPerYear * a.avgClientAnnualValue;
  const annualRevenueLow = annualRevenueLikely * a.conservativeFactor;

  return {
    monthlyLeadVolume: leads,
    assumedLeadVolume,
    primaryLeak: result.primaryLeak.label,
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
    uplift: {
      additionalClientsPerMonth: round(additionalClientsPerMonth, 2),
      additionalClientsPerYear: round(additionalClientsPerYear, 1),
      annualRevenueLow: Math.round(annualRevenueLow),
      annualRevenueLikely: Math.round(annualRevenueLikely),
    },
    illustrative: true,
    note:
      'Illustrative estimate based on your inputs and the editable assumptions shown. It models ' +
      'marketing and sales throughput only — it is not a guarantee and not financial advice.',
  };
}
