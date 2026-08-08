/**
 * Personalized proposal / demo generator. Deterministically assembles the
 * scorecard diagnosis, the ROI business case, a recommended AION plan, and the
 * next step into a single object a rep can present (or a visitor can view).
 * No LLM required. No guarantees, no financial advice.
 */
import type { Contact, ScorecardResult } from './types.js';
import type { RoiBusinessCase } from './roi.js';
import { computeRoiBusinessCase } from './roi.js';
import { computeNurturePlan, type NurturePlan } from './nurture.js';

export interface ProposalPlan {
  key: 'pilot' | 'growth';
  name: string;
  setup: number;
  monthly: number;
  tagline: string;
}

// Kept in sync with the internal pricing screen (apps/web presentation).
export const PROPOSAL_PLANS: Record<'pilot' | 'growth', ProposalPlan> = {
  pilot: {
    key: 'pilot',
    name: 'Pilot',
    setup: 4500,
    monthly: 997,
    tagline: 'A customized deployment of the already-built system, configured to your practice.',
  },
  growth: {
    key: 'growth',
    name: 'Growth System',
    setup: 7500,
    monthly: 1497,
    tagline: 'The full growth system — more automation, integrations, and reporting depth.',
  },
};

export interface PersonalizedProposal {
  headline: string;
  advisor: string;
  firm: string;
  scoreRecap: { total: number; band: string; primaryLeak: string };
  topFindings: string[];
  recommendedFirstFix: string;
  roi: RoiBusinessCase;
  nurture: Pick<NurturePlan, 'tier' | 'track' | 'trackLabel'>;
  recommendedPlan: ProposalPlan;
  anchorPlan: ProposalPlan;
  planRationale: string;
  nextStep: string;
  disclaimers: string[];
}

export function generatePersonalizedProposal(
  contact: Pick<Contact, 'fullName' | 'company' | 'monthlyLeadVolume' | 'growthPriority'>,
  result: ScorecardResult,
  roi?: RoiBusinessCase,
): PersonalizedProposal {
  const business = roi ?? computeRoiBusinessCase(contact.monthlyLeadVolume, result);
  const nurture = computeNurturePlan({ result, growthPriority: contact.growthPriority });

  // The Pilot is the recommended starting point; Growth is the anchor. High
  // volume + immediate priority makes the Growth System the sensible recommendation.
  const highVolume = (contact.monthlyLeadVolume ?? 0) >= 60;
  const immediate = contact.growthPriority === 'Immediate';
  const recommendGrowth = highVolume && immediate;
  const recommendedPlan = recommendGrowth ? PROPOSAL_PLANS.growth : PROPOSAL_PLANS.pilot;
  const anchorPlan = recommendGrowth ? PROPOSAL_PLANS.pilot : PROPOSAL_PLANS.growth;

  const planRationale = recommendGrowth
    ? 'Your lead volume and immediate timeline justify the full Growth System from the start.'
    : `The Pilot targets your primary leak (${result.primaryLeak.label}) first — the fastest path to measurable lift — with the Growth System available as you scale.`;

  return {
    headline: `Your Advisor Growth Plan — closing the ${result.primaryLeak.label} leak`,
    advisor: contact.fullName,
    firm: contact.company,
    scoreRecap: { total: result.total, band: result.band, primaryLeak: result.primaryLeak.label },
    topFindings: result.findings.map((f) => f.prompt),
    recommendedFirstFix: result.recommendedFirstFix,
    roi: business,
    nurture: { tier: nurture.tier, track: nurture.track, trackLabel: nurture.trackLabel },
    recommendedPlan,
    anchorPlan,
    planRationale,
    nextStep: 'Book your 15-minute Advisor Growth Review to validate these numbers and scope the pilot.',
    disclaimers: [
      'This is a marketing and sales process diagnostic and plan. It does not provide financial, investment, legal, tax, or insurance-product advice.',
      business.note,
    ],
  };
}
