/**
 * Structured output schemas for every AI module. AI output is NEVER trusted
 * without passing through one of these schemas (see gateway.generateStructured).
 * A validation failure fails safe — the caller receives an error result, not a
 * malformed object, and no irreversible action is taken.
 */
import { z } from 'zod';

export const QualificationStatusSchema = z.enum([
  'unqualified',
  'nurture',
  'qualified',
  'high_priority',
]);

export const LeadQualificationResultSchema = z.object({
  qualificationStatus: QualificationStatusSchema,
  intentScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  productInterests: z.array(z.string()),
  needsSummary: z.string(),
  objections: z.array(z.string()),
  missingInformation: z.array(z.string()),
  recommendedNextAction: z.string(),
  appointmentReady: z.boolean(),
});
export type LeadQualificationResult = z.infer<typeof LeadQualificationResultSchema>;

export const NeedsProfileSummarySchema = z.object({
  summary: z.string(),
  keyNeeds: z.array(z.string()),
  suggestedProducts: z.array(z.string()),
  requiresAdvisorReview: z.literal(true),
});
export type NeedsProfileSummary = z.infer<typeof NeedsProfileSummarySchema>;

export const AdvisorPrepBriefSchema = z.object({
  headline: z.string(),
  contactSnapshot: z.string(),
  talkingPoints: z.array(z.string()),
  likelyObjections: z.array(z.string()),
  recommendedProducts: z.array(z.string()),
  complianceReminders: z.array(z.string()),
});
export type AdvisorPrepBrief = z.infer<typeof AdvisorPrepBriefSchema>;

export const FollowUpMessageSchema = z.object({
  channel: z.enum(['sms', 'email']),
  subject: z.string().optional(),
  body: z.string(),
  requiresApproval: z.boolean(),
});
export type FollowUpMessage = z.infer<typeof FollowUpMessageSchema>;

export const ConversationSummarySchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  detectedIntents: z.array(z.string()),
  detectedObjections: z.array(z.string()),
  nextBestAction: z.string(),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

export const NextBestActionSchema = z.object({
  action: z.string(),
  reason: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  requiresApproval: z.boolean(),
});
export type NextBestAction = z.infer<typeof NextBestActionSchema>;

export const ComplianceCheckSchema = z.object({
  approved: z.boolean(),
  issues: z.array(
    z.object({
      severity: z.enum(['info', 'warning', 'blocker']),
      rule: z.string(),
      message: z.string(),
    }),
  ),
  revisedText: z.string().optional(),
});
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
