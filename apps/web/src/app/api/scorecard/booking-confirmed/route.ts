import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCapabilities, isDemoMode, logger } from '@aion/shared';
import { createAirtableClient } from '@aion/integrations';
import { INTENT_POINTS } from '@aion/scorecard';
import { recordOps } from '@/lib/observability';

/**
 * Records a confirmed discovery booking as an Intent event ("Discovery Booked").
 * Provider-agnostic: a scheduling tool's confirmation redirect/webhook (or the
 * in-app /advisor-scorecard/booked page) calls this. Best-effort, idempotent by
 * Event ID, and a no-op in demo mode.
 */
const BodySchema = z.object({
  submissionId: z.string().min(4).max(100),
  sourceUtm: z.string().max(500).optional(),
  leadId: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  }
  const body = parsed.data;
  const log = logger.child({ component: 'scorecard-booking-confirmed' });
  log.info('discovery booked', { submissionId: body.submissionId });
  recordOps({
    component: 'booking',
    type: 'booking_event',
    status: 'success',
    retryCount: 1,
    message: 'Discovery booking confirmed',
    correlationId: body.submissionId,
  });

  // Gated by the resolved runtime mode: demo writes nothing; pilot/production
  // only write once the gated activation checks pass (see @aion/shared/mode).
  const demo = isDemoMode();
  if (!getCapabilities().allowProductionCrmWrites) {
    return NextResponse.json({ ok: true, recorded: false, demo });
  }

  const client = createAirtableClient(log);
  if (!client) return NextResponse.json({ ok: true, recorded: false, demo });

  try {
    await client.createIntentEvent(
      {
        eventId: `${body.submissionId}:discovery_booked`,
        eventType: 'Discovery Booked',
        intentPoints: INTENT_POINTS['Discovery Booked'],
        channel: 'Scorecard',
        sourceUtm: body.sourceUtm,
        content: 'Booked the 15-minute Advisor Growth Review',
        evidence: 'Discovery booking confirmed',
        verified: true,
      },
      body.leadId,
    );
    return NextResponse.json({ ok: true, recorded: true, demo });
  } catch (err) {
    log.error('discovery booked write failed (non-blocking)', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: true, recorded: false, demo });
  }
}
