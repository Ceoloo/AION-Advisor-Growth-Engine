/**
 * Default pipeline templates (section 12 of the build brief). Applied per
 * organization at onboarding. Stage names map 1:1 to the brief so seed data and
 * the pipeline board stay consistent.
 */
import type { IndustryVertical } from '@aion/types';

export interface PipelineTemplateStage {
  name: string;
  isWon?: boolean;
  isLost?: boolean;
}

export interface PipelineTemplate {
  key: string;
  name: string;
  vertical: IndustryVertical;
  stages: PipelineTemplateStage[];
}

export const FINANCIAL_ADVISOR_PIPELINE: PipelineTemplate = {
  key: 'financial_advisor_default',
  name: 'Financial Advisor Pipeline',
  vertical: 'financial_advisor',
  stages: [
    { name: 'New Lead' },
    { name: 'Contact Attempted' },
    { name: 'Engaged' },
    { name: 'Needs Assessment Started' },
    { name: 'Qualified' },
    { name: 'Appointment Booked' },
    { name: 'Appointment Completed' },
    { name: 'Recommendation Prepared' },
    { name: 'Application or Proposal Sent' },
    { name: 'Pending Decision' },
    { name: 'Closed Won', isWon: true },
    { name: 'Closed Lost', isLost: true },
    { name: 'Long-Term Nurture' },
    { name: 'Client Review' },
    { name: 'Referral Requested' },
  ],
};

export const HEALTH_INSURANCE_PIPELINE: PipelineTemplate = {
  key: 'health_insurance_default',
  name: 'Health Insurance Pipeline',
  vertical: 'health_insurance',
  stages: [
    { name: 'New Lead' },
    { name: 'Contact Attempted' },
    { name: 'Engaged' },
    { name: 'Eligibility Review' },
    { name: 'Qualified' },
    { name: 'Quote Requested' },
    { name: 'Appointment Booked' },
    { name: 'Plan Options Presented' },
    { name: 'Application Started' },
    { name: 'Documents Pending' },
    { name: 'Application Submitted' },
    { name: 'Carrier Review' },
    { name: 'Coverage Approved' },
    { name: 'Policy Active', isWon: true },
    { name: 'Renewal Follow-Up' },
    { name: 'Cross-Sell Opportunity' },
    { name: 'Closed Lost', isLost: true },
  ],
};

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  FINANCIAL_ADVISOR_PIPELINE,
  HEALTH_INSURANCE_PIPELINE,
];

export function pipelineTemplateForVertical(vertical: IndustryVertical): PipelineTemplate {
  return vertical === 'health_insurance' ? HEALTH_INSURANCE_PIPELINE : FINANCIAL_ADVISOR_PIPELINE;
}
