/**
 * Presentation-layer content for the Ben Peretz financial-protection pilot.
 * This is scripted demo narration only — it reads from the existing demo store
 * and adds no new architecture, providers, or data sources. Marcus Johnson's
 * lead data is generated deterministically in @aion/database.
 */
import { MARCUS_LEAD_ID, MARCUS_TAGS, MARCUS_ANSWERS } from '@aion/database/demo';

export { MARCUS_LEAD_ID, MARCUS_TAGS, MARCUS_ANSWERS };

export interface JourneyStage {
  step: number;
  title: string;
  subtitle: string;
  /** What the presenter says / shows at this stage. */
  narration: string;
  /** Deep link into the live product for this stage (optional). */
  liveHref?: string;
  liveLabel?: string;
  actor: 'prospect' | 'system' | 'automation' | 'ai' | 'advisor';
}

/** The 12-stage Marcus Johnson journey, in presentation order. */
export const JOURNEY: JourneyStage[] = [
  {
    step: 1,
    title: 'Financial Protection Checkup',
    subtitle: 'Entry point',
    narration:
      'Marcus finds Ben’s Financial Protection Checkup — a short, branded questionnaire. This is the top of the funnel: a landing page, ad, referral, or QR code all lead here.',
    liveHref: '/qualify?vertical=financial_advisor',
    liveLabel: 'Open the checkup',
    actor: 'prospect',
  },
  {
    step: 2,
    title: 'Contact Capture & Consent',
    subtitle: 'Compliant intake',
    narration:
      'Marcus enters his contact details and grants SMS, email, and call consent. Consent is captured and time-stamped up front — nothing goes out without it.',
    actor: 'prospect',
  },
  {
    step: 3,
    title: 'Qualification Answers',
    subtitle: 'Needs discovery',
    narration:
      'He completes every question — income, assets, timeline, protection and estate needs. These structured answers drive both the score and the advisor brief.',
    actor: 'prospect',
  },
  {
    step: 4,
    title: 'Deterministic Score',
    subtitle: '86 — reproducible',
    narration:
      'The same deterministic engine that scores every lead returns 86. It’s explainable and reproducible — not a black box — which matters for compliance.',
    actor: 'system',
  },
  {
    step: 5,
    title: 'High-Priority Classification',
    subtitle: 'Tagged & routed',
    narration:
      'An 86 lands Marcus in the High Priority band and applies the expected tags. Classification decides routing, speed-to-lead, and which workflow fires.',
    actor: 'automation',
  },
  {
    step: 6,
    title: 'Personalized Education',
    subtitle: 'Value before the call',
    narration:
      'Marcus immediately receives educational results tailored to his answers — protection, estate, and coordination basics. Educational only; never advice.',
    actor: 'ai',
  },
  {
    step: 7,
    title: 'CRM Lead Created',
    subtitle: 'Assigned to Ben',
    narration:
      'A CRM lead is created and assigned to Ben, with the full contact, consent, score, and qualification attached. In production this upserts into GoHighLevel.',
    liveHref: `/leads/${MARCUS_LEAD_ID}`,
    liveLabel: 'Open Marcus’ lead',
    actor: 'system',
  },
  {
    step: 8,
    title: 'Pipeline Movement',
    subtitle: 'Into the funnel',
    narration:
      'Marcus advances to the “Appointment Booked” stage on the Financial Advisor pipeline. The board reflects real, moving deals.',
    liveHref: '/pipeline',
    liveLabel: 'Open the pipeline',
    actor: 'automation',
  },
  {
    step: 9,
    title: 'Follow-Up Simulation',
    subtitle: 'No external send',
    narration:
      'The follow-up sequence is simulated — drafts are prepared but external sending is disabled in demo mode, so nothing actually leaves the system.',
    actor: 'automation',
  },
  {
    step: 10,
    title: 'Appointment Booked',
    subtitle: 'Financial Protection Review',
    narration:
      'Marcus books a Financial Protection Review on Ben’s calendar. In production this syncs to the connected calendar and confirmations go out.',
    liveHref: '/appointments',
    liveLabel: 'Open appointments',
    actor: 'prospect',
  },
  {
    step: 11,
    title: 'Advisor Preparation Brief',
    subtitle: 'AI-assisted, review-gated',
    narration:
      'Ben gets an AI-generated call-prep brief — talking points, likely objections, and compliance reminders — so he walks in prepared. Advisor review required.',
    actor: 'ai',
  },
  {
    step: 12,
    title: 'Dashboard Update',
    subtitle: 'Metrics move',
    narration:
      'Every step feeds the executive dashboard — new lead, qualified, high-priority, appointment booked, pipeline value. The numbers move in real time.',
    liveHref: '/dashboard',
    liveLabel: 'Open the dashboard',
    actor: 'system',
  },
];

export const TOTAL_STAGES = JOURNEY.length;

/** The direct closing question to end the presentation on. */
export const CLOSING_QUESTION =
  'Ben — do you want to move forward with the pilot and get Marcus’ journey live for your practice?';

/** Personalized educational results shown at stage 6 (educational, not advice). */
export const EDUCATION_CARDS = [
  {
    title: 'Protecting Your Family’s Income',
    body: 'How income-replacement coverage works, how families estimate the amount of protection they may need, and what “term” vs. “permanent” generally means.',
    tag: 'Income protection',
  },
  {
    title: 'Estate Planning Basics',
    body: 'Why beneficiary designations, a will, and account titling matter, and how they interact with protection planning to keep a legacy clean.',
    tag: 'Estate planning',
  },
  {
    title: 'Coordinating College & Retirement',
    body: 'General trade-offs families weigh when funding college and retirement at the same time, and why sequencing matters.',
    tag: 'Retirement income',
  },
];

/** Simulated follow-up drafts shown at stage 9 (never sent in demo). */
export const FOLLOW_UP_DRAFTS = [
  {
    channel: 'SMS',
    when: 'Immediately',
    body: 'Hi Marcus, thanks for completing the Financial Protection Checkup! This is Ben Peretz — I have a couple of times open this week for a quick review. Would tomorrow at 3pm work?',
  },
  {
    channel: 'Email',
    when: '+2 hours',
    body: 'Subject: Your Financial Protection results & next step — A short recap of what you shared, three tailored resources, and a one-tap link to book your Financial Protection Review.',
  },
  {
    channel: 'SMS',
    when: '24h before appt',
    body: 'Reminder: your Financial Protection Review with Ben is tomorrow at 3pm. Reply C to confirm or R to reschedule.',
  },
];

/** Internal pricing (not shown to the client without intent). */
export const PRICING = [
  {
    key: 'pilot',
    name: 'Pilot',
    setup: 4500,
    monthly: 997,
    tagline: 'Customized deployment of the existing operating system, configured to your pilot.',
    features: [
      'Branded Financial Protection Checkup',
      'AI qualification + deterministic scoring',
      'One configured pipeline & follow-up sequence',
      'Advisor prep briefs',
      'Executive dashboard & reporting',
      'Approved-messaging configuration',
      'Email + calendar setup support',
    ],
    recommended: true,
  },
  {
    key: 'growth',
    name: 'Growth System',
    setup: 7500,
    monthly: 1497,
    tagline: 'The full growth system — more automation, integrations, and reporting depth.',
    features: [
      'Everything in Pilot',
      'Multiple pipelines & campaigns',
      'Re-engagement & renewal workflows',
      'Referral engine',
      'Advanced analytics & attribution',
      'Priority support & quarterly optimization',
      'Expanded integration configuration',
    ],
    recommended: false,
  },
] as const;

/** Pre-launch approval checklist categories. */
export const APPROVAL_CHECKLIST = [
  { key: 'branding', label: 'Branding', detail: 'Logo, colors, practice name, and checkup copy approved by Ben.' },
  { key: 'biography', label: 'Biography', detail: 'Advisor bio, headshot, and credentials finalized and approved.' },
  { key: 'licensing', label: 'Licensing', detail: 'Producer licenses verified for each state and product line in scope.' },
  { key: 'compliance', label: 'Compliance', detail: 'Disclosures, suitability language, and review gates approved by compliance.' },
  { key: 'communications', label: 'Communications', detail: 'SMS/email templates and cadences approved; opt-out language confirmed.' },
  { key: 'data_handling', label: 'Data Handling', detail: 'Consent capture, retention, and access controls reviewed and approved.' },
  { key: 'crm', label: 'CRM', detail: 'GoHighLevel account, pipelines, and field mapping configured and verified.' },
  { key: 'calendar', label: 'Calendar', detail: 'Booking calendar, availability, and confirmation flow connected and tested.' },
  { key: 'launch', label: 'Launch Approval', detail: 'Final written go-live sign-off from Ben before any live sending is enabled.' },
] as const;
