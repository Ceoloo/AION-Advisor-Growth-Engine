/**
 * Industry-specific qualification templates. These drive the dynamic forms in
 * the web app and the deterministic signal extraction used for scoring. Keep
 * them declarative so they can later be edited through an admin UI.
 */
import type { IndustryVertical } from '@aion/types';

export type QuestionType = 'select' | 'multiselect' | 'boolean' | 'text' | 'number';

export interface QualificationQuestion {
  key: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
  /** Marks answers that contribute financial/PHI-sensitive data. */
  sensitive?: boolean;
}

export interface QualificationTemplate {
  id: string;
  vertical: IndustryVertical;
  title: string;
  serviceCategories: string[];
  questions: QualificationQuestion[];
}

const AGE_RANGES = ['18-29', '30-39', '40-49', '50-59', '60-64', '65+'];

export const FINANCIAL_ADVISOR_TEMPLATE: QualificationTemplate = {
  id: 'financial_advisor_v1',
  vertical: 'financial_advisor',
  title: 'Financial Advisor Qualification',
  serviceCategories: [
    'Retirement planning',
    'Wealth management',
    'Life insurance',
    'Estate planning',
    'College savings',
    'Business-owner planning',
    'Tax-aware financial planning',
    'Income protection',
    'Long-term care planning',
  ],
  questions: [
    { key: 'age_range', label: 'Age range', type: 'select', options: AGE_RANGES, required: true },
    {
      key: 'employment_status',
      label: 'Employment status',
      type: 'select',
      options: ['Employed', 'Self-employed', 'Business owner', 'Retired', 'Unemployed'],
    },
    {
      key: 'household_income',
      label: 'Household income range',
      type: 'select',
      options: ['<$50k', '$50k-$99k', '$100k-$199k', '$200k-$499k', '$500k+'],
      sensitive: true,
    },
    {
      key: 'investable_assets',
      label: 'Investable assets range',
      type: 'select',
      options: ['<$50k', '$50k-$249k', '$250k-$999k', '$1M-$4.9M', '$5M+'],
      sensitive: true,
    },
    {
      key: 'retirement_timeline',
      label: 'Retirement timeline',
      type: 'select',
      options: ['Already retired', '<5 years', '5-10 years', '10-20 years', '20+ years'],
    },
    { key: 'financial_concerns', label: 'Current financial concerns', type: 'text' },
    { key: 'existing_advisor', label: 'Existing advisor relationship?', type: 'boolean' },
    { key: 'insurance_ownership', label: 'Do you own life insurance?', type: 'boolean' },
    { key: 'estate_planning_needs', label: 'Estate planning needs?', type: 'boolean' },
    { key: 'college_planning_needs', label: 'College planning needs?', type: 'boolean' },
    { key: 'debt_concerns', label: 'Significant debt concerns?', type: 'boolean' },
    { key: 'tax_planning_interest', label: 'Interested in tax planning?', type: 'boolean' },
    {
      key: 'appointment_urgency',
      label: 'How soon would you like to talk?',
      type: 'select',
      options: ['ASAP', 'This week', 'This month', 'Just researching'],
    },
    {
      key: 'preferred_channel',
      label: 'Preferred communication channel',
      type: 'select',
      options: ['Phone', 'Text', 'Email', 'Video'],
    },
  ],
};

export const HEALTH_INSURANCE_TEMPLATE: QualificationTemplate = {
  id: 'health_insurance_v1',
  vertical: 'health_insurance',
  title: 'Health Insurance Qualification',
  serviceCategories: [
    'ACA marketplace coverage',
    'Medicare Advantage',
    'Medicare Supplement',
    'Prescription drug plans',
    'Individual health insurance',
    'Family health insurance',
    'Short-term medical plans',
    'Dental plans',
    'Vision plans',
    'Small-group coverage',
    'Life and disability insurance',
  ],
  questions: [
    { key: 'state', label: 'State', type: 'text', required: true },
    { key: 'age_range', label: 'Age range', type: 'select', options: AGE_RANGES, required: true },
    { key: 'household_size', label: 'Household size', type: 'number' },
    {
      key: 'employment_status',
      label: 'Employment status',
      type: 'select',
      options: ['Employed', 'Self-employed', 'Unemployed', 'Retired'],
    },
    {
      key: 'current_coverage',
      label: 'Current coverage status',
      type: 'select',
      options: ['Uninsured', 'Employer plan', 'Marketplace', 'Medicare', 'Medicaid', 'COBRA'],
    },
    { key: 'coverage_end_date', label: 'Coverage end date', type: 'text' },
    { key: 'medicare_eligible', label: 'Medicare eligible?', type: 'boolean' },
    { key: 'medicaid_status', label: 'On Medicaid?', type: 'boolean', sensitive: true },
    {
      key: 'expected_income',
      label: 'Expected household income',
      type: 'select',
      options: ['<$20k', '$20k-$39k', '$40k-$79k', '$80k-$149k', '$150k+'],
      sensitive: true,
    },
    { key: 'preferred_doctors', label: 'Preferred doctors to keep', type: 'text', sensitive: true },
    { key: 'prescription_needs', label: 'Prescription needs', type: 'text', sensitive: true },
    { key: 'chronic_care', label: 'Chronic care considerations', type: 'boolean', sensitive: true },
    { key: 'desired_effective_date', label: 'Desired effective date', type: 'text' },
    {
      key: 'plan_scope',
      label: 'Individual or family plan',
      type: 'select',
      options: ['Individual', 'Family'],
    },
    { key: 'small_business_interest', label: 'Small-business coverage interest?', type: 'boolean' },
    { key: 'dental_vision_interest', label: 'Dental or vision interest?', type: 'boolean' },
  ],
};

export const TEMPLATES: Record<string, QualificationTemplate> = {
  [FINANCIAL_ADVISOR_TEMPLATE.id]: FINANCIAL_ADVISOR_TEMPLATE,
  [HEALTH_INSURANCE_TEMPLATE.id]: HEALTH_INSURANCE_TEMPLATE,
};

export function templateForVertical(vertical: IndustryVertical): QualificationTemplate {
  return vertical === 'health_insurance' ? HEALTH_INSURANCE_TEMPLATE : FINANCIAL_ADVISOR_TEMPLATE;
}
