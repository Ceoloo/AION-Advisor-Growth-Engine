/**
 * AI engine modules. Each is a thin, typed wrapper around the gateway that
 * embeds a task token (recognized by the mock provider) and validates output
 * against a schema. IMPORTANT: none of these functions perform side effects.
 * Callers route results through workflow rules / human approval before any
 * irreversible action (see docs/ai-layer.md).
 */
import type { AIGateway, StructuredResult } from './gateway.js';
import {
  AdvisorPrepBriefSchema,
  ComplianceCheckSchema,
  ConversationSummarySchema,
  FollowUpMessageSchema,
  LeadQualificationResultSchema,
  NeedsProfileSummarySchema,
  NextBestActionSchema,
  type AdvisorPrepBrief,
  type ComplianceCheck,
  type ConversationSummary,
  type FollowUpMessage,
  type LeadQualificationResult,
  type NeedsProfileSummary,
  type NextBestAction,
} from './schemas.js';

const COMPLIANCE_GUARDRAIL =
  'Never present regulated financial or insurance advice as final or guaranteed. ' +
  'Recommendations are educational and require licensed advisor review.';

export async function qualifyLead(
  gateway: AIGateway,
  input: { vertical: string; answers: Record<string, unknown>; context?: string },
): Promise<StructuredResult<LeadQualificationResult>> {
  return gateway.generateStructured(LeadQualificationResultSchema, {
    system: `[[TASK:qualification]] You qualify ${input.vertical} leads. ${COMPLIANCE_GUARDRAIL}`,
    prompt: `Qualification answers:\n${JSON.stringify(input.answers)}\n${input.context ?? ''}`,
  });
}

export async function summarizeNeeds(
  gateway: AIGateway,
  input: { answers: Record<string, unknown> },
): Promise<StructuredResult<NeedsProfileSummary>> {
  return gateway.generateStructured(NeedsProfileSummarySchema, {
    system: `[[TASK:needs_summary]] Summarize the prospect's needs. ${COMPLIANCE_GUARDRAIL}`,
    prompt: JSON.stringify(input.answers),
  });
}

export async function generateAdvisorBrief(
  gateway: AIGateway,
  input: { leadSummary: string; answers: Record<string, unknown> },
): Promise<StructuredResult<AdvisorPrepBrief>> {
  return gateway.generateStructured(AdvisorPrepBriefSchema, {
    system: `[[TASK:advisor_brief]] Prepare an advisor call brief. ${COMPLIANCE_GUARDRAIL}`,
    prompt: `${input.leadSummary}\n${JSON.stringify(input.answers)}`,
  });
}

export async function generateFollowUp(
  gateway: AIGateway,
  input: { channel: 'sms' | 'email'; context: string },
): Promise<StructuredResult<FollowUpMessage>> {
  return gateway.generateStructured(FollowUpMessageSchema, {
    system: `[[TASK:follow_up]] Draft a compliant ${input.channel} follow-up. ${COMPLIANCE_GUARDRAIL} Set requiresApproval=true.`,
    prompt: input.context,
  });
}

export async function summarizeConversation(
  gateway: AIGateway,
  input: { transcript: string },
): Promise<StructuredResult<ConversationSummary>> {
  return gateway.generateStructured(ConversationSummarySchema, {
    system: '[[TASK:conversation_summary]] Summarize the conversation and detect intent/objections.',
    prompt: input.transcript,
  });
}

export async function nextBestAction(
  gateway: AIGateway,
  input: { leadState: string },
): Promise<StructuredResult<NextBestAction>> {
  return gateway.generateStructured(NextBestActionSchema, {
    system: '[[TASK:next_best_action]] Recommend the single next best action.',
    prompt: input.leadState,
  });
}

export async function checkComplianceLanguage(
  gateway: AIGateway,
  input: { text: string; channel: string },
): Promise<StructuredResult<ComplianceCheck>> {
  return gateway.generateStructured(ComplianceCheckSchema, {
    system: `[[TASK:compliance_check]] Review outbound ${input.channel} copy for TCPA/CAN-SPAM/suitability issues. ${COMPLIANCE_GUARDRAIL}`,
    prompt: input.text,
  });
}
