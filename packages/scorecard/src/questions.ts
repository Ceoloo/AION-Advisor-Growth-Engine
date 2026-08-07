/**
 * The 18-question Advisor Conversion Scorecard bank. This is deterministic
 * configuration/data — scoring reads points from here, never from scattered
 * conditionals in UI. Each question's `maxPoints` equals its highest option.
 * `whyItMatters` and `implication` power the deterministic findings.
 *
 * Section point budgets: Acquisition 15, Speed-to-Lead 15, Qualification 20,
 * Follow-Up & Nurture 20, Booking & Show 15, CRM & Attribution 15 = 100.
 */
import type { SectionId } from './sections.js';

export interface QuestionOption {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  section: SectionId;
  order: number;
  prompt: string;
  options: QuestionOption[];
  maxPoints: number;
  whyItMatters: string;
  implication: string;
}

export const QUESTIONS: Question[] = [
  // --- Acquisition — 15 ------------------------------------------------------
  {
    id: 'q1',
    section: 'acquisition',
    order: 1,
    prompt: 'How consistently does your practice generate new prospect inquiries each month?',
    options: [
      { label: 'Unpredictable / mostly occasional referrals', points: 0 },
      { label: 'Some recurring sources but inconsistent', points: 2 },
      { label: 'Several repeatable sources with reasonable consistency', points: 4 },
      { label: 'Predictable multi-channel flow with source tracking', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Predictable inflow is the foundation of a scalable practice; inconsistent lead volume makes every other improvement harder to measure.',
    implication: 'Without repeatable sources, growth depends on luck and referrals you can’t control.',
  },
  {
    id: 'q2',
    section: 'acquisition',
    order: 2,
    prompt: 'Do your website, content, and outreach make the next step obvious for a prospect?',
    options: [
      { label: 'No clear CTA', points: 0 },
      { label: 'Generic contact form / phone number only', points: 2 },
      { label: 'Clear consultation or assessment CTA', points: 4 },
      { label: 'Clear CTA tailored by audience or intent', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'A clear, specific call-to-action converts interest into an inquiry; a vague one loses ready prospects.',
    implication: 'Interested prospects leave without an obvious way to take the next step.',
  },
  {
    id: 'q3',
    section: 'acquisition',
    order: 3,
    prompt: 'Can you tell which lead sources or campaigns actually produce qualified appointments?',
    options: [
      { label: 'No tracking', points: 0 },
      { label: 'Know the lead source informally', points: 2 },
      { label: 'Source is recorded in CRM', points: 4 },
      { label: 'Source-to-appointment / client conversion is measured', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Attribution tells you where to reinvest; without it, spend and effort are allocated blind.',
    implication: 'You can’t double down on what works or cut what doesn’t.',
  },

  // --- Speed-to-Lead — 15 ----------------------------------------------------
  {
    id: 'q4',
    section: 'speed_to_lead',
    order: 1,
    prompt: 'How quickly does a new qualified inquiry usually receive its first response?',
    options: [
      { label: 'More than one business day / inconsistent', points: 0 },
      { label: 'Same day', points: 2 },
      { label: 'Within one hour', points: 4 },
      { label: 'Immediate acknowledgement plus same-day human follow-up where appropriate', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Response speed is one of the strongest drivers of contact and conversion; interest decays fast.',
    implication: 'Slow first responses hand ready prospects to faster competitors.',
  },
  {
    id: 'q5',
    section: 'speed_to_lead',
    order: 2,
    prompt: 'Is every new lead automatically assigned to a person or workflow with a next action?',
    options: [
      { label: 'No formal ownership', points: 0 },
      { label: 'Usually assigned manually', points: 2 },
      { label: 'CRM owner/task is consistently assigned', points: 4 },
      { label: 'Automatic routing with SLA and escalation', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Clear ownership prevents leads from slipping through the cracks between people.',
    implication: 'Unowned leads go cold while everyone assumes someone else has them.',
  },
  {
    id: 'q6',
    section: 'speed_to_lead',
    order: 3,
    prompt: 'What happens when a prospect submits an inquiry outside business hours?',
    options: [
      { label: 'Nothing until someone notices', points: 0 },
      { label: 'Generic auto-reply', points: 2 },
      { label: 'Relevant acknowledgement plus clear next step', points: 4 },
      { label: 'Acknowledgement, segmentation, booking option, and queued human follow-up', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Many inquiries arrive after hours; a good after-hours experience captures intent while it’s high.',
    implication: 'After-hours prospects cool off or move on before anyone replies.',
  },

  // --- Qualification — 20 ----------------------------------------------------
  {
    id: 'q7',
    section: 'qualification',
    order: 1,
    prompt: 'Before a prospect reaches your calendar, how much do you know about why they are seeking help?',
    options: [
      { label: 'Name/contact only', points: 0 },
      { label: 'A few generic form fields', points: 3 },
      { label: 'Needs/goals/timing captured', points: 5 },
      { label: 'Structured intake captures fit, need, urgency, and context', points: 7 },
    ],
    maxPoints: 7,
    whyItMatters: 'Structured intake lets you prepare, prioritize, and route — and protects your calendar from poor-fit meetings.',
    implication: 'You walk into consultations blind and spend calendar time on the wrong prospects.',
  },
  {
    id: 'q8',
    section: 'qualification',
    order: 2,
    prompt: 'Do you have a consistent way to identify which prospects should be contacted first?',
    options: [
      { label: 'First-come / intuition only', points: 0 },
      { label: 'Informal judgment', points: 2 },
      { label: 'Clear qualification rules', points: 4 },
      { label: 'Scoring/tagging drives prioritized action', points: 6 },
    ],
    maxPoints: 6,
    whyItMatters: 'Prioritization focuses limited time on the prospects most likely to become clients.',
    implication: 'High-intent prospects wait in the same queue as low-fit ones.',
  },
  {
    id: 'q9',
    section: 'qualification',
    order: 3,
    prompt: 'Are different prospect types routed into different next steps based on their needs?',
    options: [
      { label: 'Everyone follows the same path', points: 0 },
      { label: 'Manual segmentation', points: 2 },
      { label: 'Tags/fields route different types', points: 4 },
      { label: 'Routing, nurture, booking, and prep adapt to segment and intent', points: 7 },
    ],
    maxPoints: 7,
    whyItMatters: 'Segment-specific routing makes each prospect’s next step relevant, which lifts conversion.',
    implication: 'A one-size-fits-all path under-serves your best-fit segments.',
  },

  // --- Follow-Up & Nurture — 20 ----------------------------------------------
  {
    id: 'q10',
    section: 'follow_up',
    order: 1,
    prompt: 'What happens if a good-fit prospect does not book or respond after the first contact?',
    options: [
      { label: 'Usually no structured follow-up', points: 0 },
      { label: '1–2 manual attempts', points: 3 },
      { label: 'Defined multi-touch cadence', points: 5 },
      { label: 'Cadence adapts to engagement and stops on real conversation / opt-out', points: 7 },
    ],
    maxPoints: 7,
    whyItMatters: 'Most conversions take several touches; a defined cadence recovers prospects a single attempt would lose.',
    implication: 'Good-fit prospects who don’t reply the first time are quietly lost.',
  },
  {
    id: 'q11',
    section: 'follow_up',
    order: 2,
    prompt: 'Do not-ready-yet prospects stay in a useful nurture system?',
    options: [
      { label: 'Mostly forgotten', points: 0 },
      { label: 'Occasional newsletter only', points: 2 },
      { label: 'Segmented educational nurture', points: 4 },
      { label: 'Nurture is segmented, behavior-aware, and linked to future sales actions', points: 6 },
    ],
    maxPoints: 6,
    whyItMatters: 'Timelines vary; staying useful keeps you top-of-mind until the prospect is ready.',
    implication: 'Prospects who would convert later are forgotten before they’re ready.',
  },
  {
    id: 'q12',
    section: 'follow_up',
    order: 3,
    prompt: 'Do you systematically revisit old leads, no-decisions, or prospects who asked to reconnect later?',
    options: [
      { label: 'Rarely', points: 0 },
      { label: 'Manually when remembered', points: 2 },
      { label: 'Scheduled reactivation campaigns / future dates', points: 4 },
      { label: 'CRM-driven reactivation based on timing, intent, or relevant events', points: 7 },
    ],
    maxPoints: 7,
    whyItMatters: 'Your existing lead list is often the cheapest source of new opportunities.',
    implication: 'Past leads that said “later” never get a systematic second look.',
  },

  // --- Booking & Show — 15 ---------------------------------------------------
  {
    id: 'q13',
    section: 'booking',
    order: 1,
    prompt: 'How easy is it for a qualified prospect to schedule the right consultation?',
    options: [
      { label: 'Back-and-forth scheduling', points: 0 },
      { label: 'Generic booking link', points: 2 },
      { label: 'Clear booking path with correct meeting type', points: 4 },
      { label: 'Qualified routing plus appropriate booking options plus confirmation', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Every step of scheduling friction loses a share of ready prospects.',
    implication: 'Ready prospects drop off during back-and-forth scheduling.',
  },
  {
    id: 'q14',
    section: 'booking',
    order: 2,
    prompt: 'What happens between booking and the appointment?',
    options: [
      { label: 'Calendar invite only', points: 0 },
      { label: 'One generic reminder', points: 2 },
      { label: 'Confirmation plus timed reminders', points: 4 },
      { label: 'Confirmation, reminders, expectations, and easy reschedule path', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Confirmation and reminders are the single most reliable lever on show rate.',
    implication: 'Booked prospects forget or deprioritize and quietly no-show.',
  },
  {
    id: 'q15',
    section: 'booking',
    order: 3,
    prompt: 'If a prospect misses an appointment, is there a defined recovery process?',
    options: [
      { label: 'Usually manual / inconsistent', points: 0 },
      { label: 'One reschedule message', points: 2 },
      { label: 'Structured recovery with easy rescheduling', points: 4 },
      { label: 'Recovery is tracked and prospects can move into nurture when appropriate', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'A no-show is not a lost prospect unless there’s no recovery path.',
    implication: 'Missed appointments are written off instead of recovered.',
  },

  // --- CRM & Attribution — 15 ------------------------------------------------
  {
    id: 'q16',
    section: 'crm',
    order: 1,
    prompt: 'Can you see every active opportunity, its stage, owner, and next action in one place?',
    options: [
      { label: 'Scattered / no reliable CRM', points: 0 },
      { label: 'CRM exists but incomplete', points: 2 },
      { label: 'Stages and owners are consistently updated', points: 4 },
      { label: 'Every active opportunity has stage, owner, next action, and date', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'You can’t manage what you can’t see; pipeline discipline is the base layer of forecasting.',
    implication: 'Opportunities stall because no one can see what needs to happen next.',
  },
  {
    id: 'q17',
    section: 'crm',
    order: 2,
    prompt: 'Do you regularly measure lead-to-appointment, show rate, response time, and consultation-to-next-step conversion?',
    options: [
      { label: 'Not measured', points: 0 },
      { label: 'Some metrics manually', points: 2 },
      { label: 'Core metrics reviewed consistently', points: 4 },
      { label: 'Baseline/current/target metrics reviewed and used to make changes', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Funnel KPIs turn a vague “we need more leads” into a specific, fixable bottleneck.',
    implication: 'Without KPI visibility, you can’t tell where the funnel is actually leaking.',
  },
  {
    id: 'q18',
    section: 'crm',
    order: 3,
    prompt: 'Can you connect new client opportunities or revenue back to the source, campaign, or referral that generated them?',
    options: [
      { label: 'No', points: 0 },
      { label: 'Sometimes based on memory', points: 2 },
      { label: 'Source is captured through the funnel', points: 4 },
      { label: 'Source-to-opportunity/client/revenue is consistently reported when verifiable', points: 5 },
    ],
    maxPoints: 5,
    whyItMatters: 'Revenue attribution shows which activities actually create clients, not just leads.',
    implication: 'Marketing decisions are made without knowing what produced real revenue.',
  },
];

export const QUESTIONS_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);
