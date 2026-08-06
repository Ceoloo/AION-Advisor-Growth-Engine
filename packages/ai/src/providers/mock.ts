/**
 * Deterministic mock AI provider. Lets the entire platform — demos, tests,
 * local dev — run with zero external calls or API keys. It recognizes a task
 * token embedded by the engines (e.g. "[[TASK:qualification]]") and returns
 * schema-valid canned JSON, so structured outputs always validate.
 */
import type { AICompletion, AICompletionRequest, AIProvider } from '../gateway.js';

const CANNED: Record<string, unknown> = {
  qualification: {
    qualificationStatus: 'qualified',
    intentScore: 72,
    urgencyScore: 64,
    productInterests: ['Retirement planning', 'Life insurance'],
    needsSummary:
      'Prospect is nearing retirement and wants to protect income while reducing tax exposure. Open to a review call.',
    objections: ['Wants to compare options', 'Concerned about fees'],
    missingInformation: ['Investable assets range', 'Existing advisor relationship'],
    recommendedNextAction: 'Book a 30-minute retirement review and send the intake questionnaire.',
    appointmentReady: true,
  },
  needs_summary: {
    summary:
      'Household focused on retirement income and protecting against market downside. Interested in consolidating accounts. Advisor review required before any recommendation.',
    keyNeeds: ['Retirement income planning', 'Downside protection', 'Account consolidation'],
    suggestedProducts: ['Retirement planning', 'Income protection'],
    requiresAdvisorReview: true,
  },
  advisor_brief: {
    headline: 'Warm retirement-planning lead, appointment-ready',
    contactSnapshot: '58, pre-retiree, moderate risk tolerance, ~$500k investable assets (self-reported).',
    talkingPoints: [
      'Confirm retirement timeline and income goals',
      'Discuss tax-aware withdrawal strategy',
      'Review current coverage gaps',
    ],
    likelyObjections: ['Fee sensitivity', 'Wants to compare with current advisor'],
    recommendedProducts: ['Retirement planning', 'Income protection'],
    complianceReminders: [
      'Do not present recommendations as final without documented suitability review',
      'Capture call consent before recording',
    ],
  },
  follow_up: {
    channel: 'sms',
    body: 'Hi {{firstName}}, thanks for your interest! I have a couple of times open this week for a quick retirement review. Would Thursday at 2pm work?',
    requiresApproval: true,
  },
  conversation_summary: {
    summary: 'Prospect responded positively and asked about fees and timing.',
    sentiment: 'positive',
    detectedIntents: ['book_appointment', 'pricing_inquiry'],
    detectedObjections: ['fee_concern'],
    nextBestAction: 'Send available appointment slots and a plain-language fee overview.',
  },
  next_best_action: {
    action: 'Send appointment booking link with two proposed times',
    reason: 'Lead is qualified, engaged, and appointment-ready but has not booked yet.',
    priority: 'high',
    requiresApproval: false,
  },
  compliance_check: {
    approved: true,
    issues: [
      {
        severity: 'info',
        rule: 'suitability',
        message: 'General educational language only; no specific product guarantees present.',
      },
    ],
  },
};

function detectTask(request: AICompletionRequest): string {
  const haystack = `${request.system ?? ''}\n${request.prompt}`;
  const match = haystack.match(/\[\[TASK:([a-z_]+)\]\]/);
  return match?.[1] ?? 'qualification';
}

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';
  readonly model = 'mock-1';

  async complete(request: AICompletionRequest): Promise<AICompletion> {
    const task = detectTask(request);
    const payload = CANNED[task] ?? { note: 'mock response' };
    const text = JSON.stringify(payload);
    return {
      text,
      usage: {
        provider: this.name,
        model: this.model,
        inputTokens: Math.ceil((request.prompt.length + (request.system?.length ?? 0)) / 4),
        outputTokens: Math.ceil(text.length / 4),
        costUsd: 0,
      },
    };
  }
}
