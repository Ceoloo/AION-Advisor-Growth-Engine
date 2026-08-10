import { generatePreCallBrief, type PreCallBrief } from '@aion/ai';
import { getLeadDetail } from '@/lib/demo';

type LeadDetail = NonNullable<ReturnType<typeof getLeadDetail>>;

/** Derive the funnel entry point from the lead's timeline (falls back by vertical). */
function entryPointFor(detail: LeadDetail): string {
  const checkup = detail.timeline.find((e) => /checkup|scorecard|assessment/i.test(e.label));
  if (checkup) return checkup.label.replace(/^Started the /i, '');
  return detail.lead.vertical === 'financial_advisor'
    ? 'Financial Protection Checkup'
    : 'Coverage inquiry';
}

/**
 * Build the deterministic pre-call Advisor Brief for a lead from its demo
 * detail. This is the same brief the workflow generates when the appointment is
 * booked — always available, no LLM.
 */
export function preCallBriefForLead(detail: LeadDetail): PreCallBrief {
  const { lead, contact, qualification, appointments } = detail;
  const appt = appointments[0];
  return generatePreCallBrief({
    firstName: contact?.firstName ?? 'Lead',
    lastName: contact?.lastName ?? '',
    state: contact?.state,
    vertical: lead.vertical,
    score: lead.score,
    scoreBand: lead.scoreBand,
    source: lead.source,
    entryPoint: entryPointFor(detail),
    appointmentTitle: appt?.title,
    qualification: qualification?.result ?? null,
    answers: qualification?.answers,
  });
}

/** True when the lead has a booked appointment (so the brief is relevant). */
export function leadHasBooking(detail: LeadDetail): boolean {
  return detail.appointments.some((a) => a.status !== 'cancelled');
}
