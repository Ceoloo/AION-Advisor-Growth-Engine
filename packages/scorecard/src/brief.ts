/**
 * Internal Advisor Brief generator. Deterministic (no LLM required). Produces a
 * structured brief a rep can read before a discovery call. NOT sent externally
 * automatically — this only builds the object/string.
 */
import type { ScorecardResult } from './types.js';
import type { Contact, Attribution } from './types.js';

export interface AdvisorBrief {
  advisor: string;
  firm: string;
  role: string;
  score: number;
  scoreBand: string;
  primaryLeak: string;
  highestSection: string;
  monthlyLeadVolume: string;
  leadSources: string;
  currentCrm: string;
  growthPriority: string;
  topFindings: string[];
  recommendedDiscoveryAngle: string;
  suggestedFirstFix: string;
  sourceCampaign: string;
  consentStatus: string;
}

export function generateAdvisorBrief(
  contact: Contact,
  result: ScorecardResult,
  attribution?: Attribution,
): AdvisorBrief {
  const highest = result.strengths[0]?.label ?? '—';
  const angle =
    result.primaryLeak.key === 'multiple_systemic'
      ? 'Lead with the systemic pattern — several stages are leaking at once — and frame a sequenced fix starting with the weakest.'
      : `Lead with the ${result.primaryLeak.label} leak: it is the single highest-leverage fix in their funnel today.`;

  const src =
    attribution?.campaign ||
    attribution?.utm?.utm_campaign ||
    attribution?.source ||
    attribution?.utm?.utm_source ||
    'Direct / unknown';

  return {
    advisor: contact.fullName,
    firm: contact.company,
    role: contact.role || '—',
    score: result.total,
    scoreBand: result.band,
    primaryLeak: result.primaryLeak.label,
    highestSection: highest,
    monthlyLeadVolume:
      contact.monthlyLeadVolume != null ? String(contact.monthlyLeadVolume) : '—',
    leadSources: contact.primaryLeadSources || '—',
    currentCrm: contact.currentCrm || '—',
    growthPriority: contact.growthPriority || '—',
    topFindings: result.findings.map((f) => `${f.prompt} — ${f.observedGap}`),
    recommendedDiscoveryAngle: angle,
    suggestedFirstFix: result.recommendedFirstFix,
    sourceCampaign: src,
    consentStatus: contact.consentToFollowUp ? 'Opted in to follow-up' : 'No marketing consent',
  };
}

/** Render the brief as a readable plain-text block (for logs / internal view). */
export function renderAdvisorBriefText(b: AdvisorBrief): string {
  return [
    `Advisor: ${b.advisor}`,
    `Firm: ${b.firm}`,
    `Role: ${b.role}`,
    `Score: ${b.score} / 100`,
    `Score Band: ${b.scoreBand}`,
    `Primary Leak: ${b.primaryLeak}`,
    `Highest Section: ${b.highestSection}`,
    `Monthly Lead Volume: ${b.monthlyLeadVolume}`,
    `Lead Sources: ${b.leadSources}`,
    `Current CRM: ${b.currentCrm}`,
    `Growth Priority: ${b.growthPriority}`,
    `Top Findings:\n${b.topFindings.map((f) => `  - ${f}`).join('\n')}`,
    `Recommended Discovery Angle: ${b.recommendedDiscoveryAngle}`,
    `Suggested First Fix: ${b.suggestedFirstFix}`,
    `Source / Campaign: ${b.sourceCampaign}`,
    `Consent Status: ${b.consentStatus}`,
  ].join('\n');
}
