/**
 * The six sections of the Advisor Conversion Infrastructure Score. This is the
 * editable source of truth for section weights, the recommended first fix, and
 * the 30-day plan per section. Keep copy factual — this diagnoses a marketing /
 * sales conversion process. It is NOT financial, investment, or regulated advice.
 */

export type SectionId =
  | 'acquisition'
  | 'speed_to_lead'
  | 'qualification'
  | 'follow_up'
  | 'booking'
  | 'crm';

export interface SectionConfig {
  id: SectionId;
  label: string;
  order: number;
  /** Sum of the max points of this section's questions. */
  maxPoints: number;
  /** The single recommended first fix when this section is the primary leak. */
  firstFix: string;
  /** A short three-step, 30-day priority plan for this section. */
  plan30Day: [string, string, string];
  /** Factual, response-agnostic strength statement (used for "doing well"). */
  strength: string;
}

export const SECTIONS: Record<SectionId, SectionConfig> = {
  acquisition: {
    id: 'acquisition',
    label: 'Acquisition',
    order: 1,
    maxPoints: 15,
    firstFix: 'Improve CTA clarity and source attribution before adding more traffic.',
    plan30Day: [
      'Make the next step obvious: one clear consultation/assessment CTA across site, content, and outreach.',
      'Record lead source on every inquiry so channels can be compared.',
      'Start measuring source-to-appointment, not just source-to-lead.',
    ],
    strength: 'Your prospect inflow and calls-to-action are relatively well structured.',
  },
  speed_to_lead: {
    id: 'speed_to_lead',
    label: 'Speed-to-Lead',
    order: 2,
    maxPoints: 15,
    firstFix: 'Implement immediate acknowledgement, clear ownership, an SLA, and same-day human follow-up.',
    plan30Day: [
      'Add an immediate acknowledgement for every new inquiry (including after-hours).',
      'Auto-assign each lead to an owner or workflow with a defined next action.',
      'Set and monitor a first-response SLA with escalation.',
    ],
    strength: 'New inquiries are acknowledged and owned quickly.',
  },
  qualification: {
    id: 'qualification',
    label: 'Qualification',
    order: 3,
    maxPoints: 20,
    firstFix: 'Build structured intake, lead scoring, and segment-specific routing.',
    plan30Day: [
      'Capture fit, need, urgency, and context in intake before the calendar.',
      'Introduce simple scoring/tagging to prioritize who gets contacted first.',
      'Route different prospect types into different next steps.',
    ],
    strength: 'You capture useful context and prioritize prospects deliberately.',
  },
  follow_up: {
    id: 'follow_up',
    label: 'Follow-Up & Nurture',
    order: 4,
    maxPoints: 20,
    firstFix: 'Build a behavior-aware multi-touch nurture cadence plus systematic reactivation.',
    plan30Day: [
      'Define a multi-touch follow-up cadence for good-fit prospects who don’t book.',
      'Add a segmented nurture track for not-ready-yet prospects.',
      'Schedule reactivation of old leads and “reconnect later” prospects.',
    ],
    strength: 'Prospects who don’t convert immediately are followed up and nurtured.',
  },
  booking: {
    id: 'booking',
    label: 'Booking & Show',
    order: 5,
    maxPoints: 15,
    firstFix: 'Improve qualified booking, reminders, rescheduling, and no-show recovery.',
    plan30Day: [
      'Give qualified prospects a clear booking path to the right meeting type.',
      'Add confirmation, timed reminders, and an easy reschedule path.',
      'Define a no-show recovery process that can move prospects into nurture.',
    ],
    strength: 'Booking is straightforward and appointments are supported through to show.',
  },
  crm: {
    id: 'crm',
    label: 'CRM & Attribution',
    order: 6,
    maxPoints: 15,
    firstFix: 'Implement clear stages, owners, next-action dates, KPI tracking, and source attribution.',
    plan30Day: [
      'Ensure every active opportunity has a stage, owner, and next-action date.',
      'Review core funnel KPIs (lead-to-appointment, show rate, response time, next-step conversion).',
      'Capture source through the funnel so opportunities and revenue can be attributed.',
    ],
    strength: 'Your pipeline is visible and funnel metrics are tracked.',
  },
};

export const SECTION_ORDER: SectionId[] = (Object.values(SECTIONS) as SectionConfig[])
  .sort((a, b) => a.order - b.order)
  .map((s) => s.id);

export const TOTAL_MAX_POINTS = 100;
