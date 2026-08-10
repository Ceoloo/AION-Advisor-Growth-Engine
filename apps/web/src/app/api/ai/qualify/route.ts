import { NextResponse } from 'next/server';
import { z } from 'zod';
import { computeScore, extractSignals, qualifyLead, templateForVertical } from '@aion/ai';
import { getGateway } from '@/lib/ai';
import { recordOps } from '@/lib/observability';

const BodySchema = z.object({
  vertical: z.enum(['financial_advisor', 'health_insurance']),
  answers: z.record(z.unknown()),
});

/**
 * Qualify a lead: deterministic rule-based score + AI-assisted qualification.
 * Scoring never depends on the AI call, so a schema failure degrades to a
 * scored-but-not-AI-summarized result rather than failing the whole request.
 */
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  }

  const { vertical, answers } = parsed.data;
  const template = templateForVertical(vertical);
  const signals = extractSignals(vertical, answers, template.questions.length);
  const score = computeScore(signals);

  const gateway = getGateway();
  const qual = await qualifyLead(gateway, { vertical, answers });

  // AI is fail-safe: a schema/provider failure degrades to the rule-based
  // result rather than failing the request — but we still record the fault.
  recordOps(
    qual.ok
      ? { component: 'ai', type: 'ai_call', status: 'success', retryCount: 1, message: 'Lead qualification' }
      : {
          component: 'ai',
          type: 'ai_call',
          status: 'failure',
          retryCount: 1,
          message: 'AI qualification failed — used rule-based fallback',
          error: 'error' in qual ? String(qual.error) : 'AI output invalid',
        },
  );

  return NextResponse.json({
    ok: true,
    score: { total: score.total, band: score.band, breakdown: score.breakdown },
    qualification: qual.ok
      ? qual.data
      : {
          // Fail-safe fallback derived from deterministic signals.
          qualificationStatus:
            score.total >= 75 ? 'high_priority' : score.total >= 55 ? 'qualified' : 'nurture',
          intentScore: Math.round(signals.intent ?? 50),
          urgencyScore: Math.round(signals.urgency ?? 50),
          needsSummary: 'AI summary unavailable — showing rule-based assessment.',
          productInterests: template.serviceCategories.slice(0, 2),
          recommendedNextAction: 'Follow up to gather missing information.',
          appointmentReady: score.total >= 55,
          missingInformation: [],
        },
    aiProvider: gateway.providerName,
  });
}
