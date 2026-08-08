/**
 * Deterministic demo submission for sales presentations. Realistic but entirely
 * fictional. These answers are tuned to produce a 57 / 100 ("Conversion Gaps")
 * with Follow-Up & Nurture as the clear primary leak — asserted in tests.
 */
import type { Answers, Contact, Attribution, Submission } from './types.js';

export const DEMO_ANSWERS: Answers = {
  q1: 3, q2: 2, q3: 2, // Acquisition = 13/15
  q4: 1, q5: 1, q6: 1, // Speed-to-Lead = 6/15
  q7: 2, q8: 2, q9: 1, // Qualification = 11/20
  q10: 1, q11: 1, q12: 0, // Follow-Up = 5/20  (primary leak)
  q13: 2, q14: 2, q15: 1, // Booking = 10/15
  q16: 2, q17: 2, q18: 2, // CRM = 12/15
};

export const DEMO_CONTACT: Contact = {
  fullName: 'Marcus Johnson',
  email: 'marcus.johnson@johnsonwealth.example',
  company: 'Johnson Wealth Planning',
  phone: '555-018-2245',
  role: 'Founder / Advisor',
  monthlyLeadVolume: 25,
  primaryLeadSources: 'Referrals, LinkedIn, Webinars',
  currentCrm: 'HubSpot',
  growthPriority: '30 Days',
  consentToFollowUp: false,
};

export const DEMO_ATTRIBUTION: Attribution = {
  source: 'demo',
  campaign: 'AION Financial Advisor Demand Engine v1',
  landingPath: '/advisor-scorecard',
  utm: { utm_source: 'demo', utm_medium: 'presentation', utm_campaign: 'client_zero' },
};

export const DEMO_SUBMISSION: Submission = {
  submissionId: 'demo-marcus-johnson-0001',
  answers: DEMO_ANSWERS,
  contact: DEMO_CONTACT,
  attribution: DEMO_ATTRIBUTION,
  anonymousId: 'demo-anon',
};
