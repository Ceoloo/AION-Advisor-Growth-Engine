import { z } from 'zod';
import { QUESTIONS } from './questions.js';
import type { SectionId } from './sections.js';

/** Answers map: question id → selected option index. */
export const AnswersSchema = z
  .record(z.string(), z.number().int().min(0))
  .refine((a) => QUESTIONS.every((q) => typeof a[q.id] === 'number'), {
    message: 'All 18 questions must be answered',
  })
  .refine(
    (a) => QUESTIONS.every((q) => (a[q.id] ?? -1) < q.options.length),
    { message: 'Answer index out of range for a question' },
  );
export type Answers = z.infer<typeof AnswersSchema>;

export const GrowthPrioritySchema = z.enum(['Immediate', '30 Days', '60–90 Days', 'Exploring']);
export type GrowthPriority = z.infer<typeof GrowthPrioritySchema>;

export const ContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('A valid email is required').max(200),
  company: z.string().min(1, 'Company / practice is required').max(200),
  phone: z.string().max(50).optional().or(z.literal('')),
  role: z.string().max(120).optional().or(z.literal('')),
  monthlyLeadVolume: z.number().int().min(0).max(1_000_000).optional(),
  primaryLeadSources: z.string().max(500).optional().or(z.literal('')),
  currentCrm: z.string().max(120).optional().or(z.literal('')),
  growthPriority: GrowthPrioritySchema.optional(),
  /** Explicit, unchecked-by-default marketing follow-up opt-in. */
  consentToFollowUp: z.boolean().default(false),
});
export type Contact = z.infer<typeof ContactSchema>;

export const AttributionSchema = z.object({
  source: z.string().max(300).optional(),
  campaign: z.string().max(300).optional(),
  referrer: z.string().max(1000).optional(),
  landingPath: z.string().max(1000).optional(),
  utm: z
    .object({
      utm_source: z.string().max(300).optional(),
      utm_medium: z.string().max(300).optional(),
      utm_campaign: z.string().max(300).optional(),
      utm_term: z.string().max(300).optional(),
      utm_content: z.string().max(300).optional(),
    })
    .partial()
    .optional(),
});
export type Attribution = z.infer<typeof AttributionSchema>;

export const SubmissionSchema = z.object({
  /** Client-generated stable id for idempotent retries. */
  submissionId: z.string().min(8).max(100),
  answers: AnswersSchema,
  contact: ContactSchema,
  attribution: AttributionSchema.optional(),
  anonymousId: z.string().max(100).optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

// --- Result shapes -----------------------------------------------------------

export interface SectionScore {
  id: SectionId;
  label: string;
  earned: number;
  max: number;
  /** 0..1 fraction of the section's possible points. */
  pct: number;
}

export interface Finding {
  questionId: string;
  section: SectionId;
  prompt: string;
  selectedOption: string;
  observedGap: string;
  whyItMatters: string;
  implication: string;
  earned: number;
  max: number;
}

export interface ScorecardResult {
  total: number;
  band: string;
  bandKey: string;
  sections: SectionScore[];
  /** Weakest section by normalized percentage, or 'multiple_systemic'. */
  primaryLeak: { key: SectionId | 'multiple_systemic'; label: string };
  /** The concrete section used to drive the first fix even when systemic. */
  leakSection: SectionId;
  strengths: { id: SectionId; label: string; statement: string }[];
  findings: Finding[];
  recommendedFirstFix: string;
  plan30Day: string[];
}
