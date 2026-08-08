import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadEnv, logger } from '@aion/shared';
import { createAirtableClient } from '@aion/integrations';
import { EVENT_TO_INTENT, INTENT_POINTS, TRACKING_EVENTS } from '@aion/scorecard';

/**
 * Reusable intent/analytics event sink. Every scorecard tracking event is
 * logged here (the single event architecture). Events mapped to a CRM intent
 * type (completion, booking) are additionally recorded in Airtable when
 * configured and not in demo mode — best-effort, idempotent by Event ID.
 */
const BodySchema = z.object({
  event: z.enum(TRACKING_EVENTS),
  anonymousId: z.string().max(100).optional(),
  submissionId: z.string().max(100).optional(),
  sessionId: z.string().max(100).optional(),
  score: z.number().optional(),
  scoreBand: z.string().max(80).optional(),
  primaryLeak: z.string().max(120).optional(),
  section: z.string().max(80).optional(),
  currentQuestion: z.number().int().optional(),
  sourceUtm: z.string().max(500).optional(),
  leadId: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 422 });
  }

  const env = loadEnv();
  const body = parsed.data;
  const log = logger.child({ component: 'scorecard-event' });
  // The single analytics layer: structured log for every event (redacted).
  log.info('scorecard event', { ...body });

  const intentType = EVENT_TO_INTENT[body.event];
  let recorded = false;

  // Only booking intent is persisted from this endpoint; completion is written
  // authoritatively by /api/scorecard/submit (which has the full score).
  if (intentType === 'Booking Page Viewed' && !env.DEMO_MODE) {
    const client = createAirtableClient(log);
    if (client) {
      try {
        await client.createIntentEvent({
          eventId: `${body.submissionId ?? body.anonymousId ?? 'anon'}:booking_viewed`,
          eventType: 'Booking Page Viewed',
          intentPoints: INTENT_POINTS['Booking Page Viewed'],
          channel: 'Scorecard',
          sourceUtm: body.sourceUtm,
          content: 'Clicked "Book My 15-Minute Advisor Growth Review"',
          evidence: 'Viewed the Advisor Growth Review booking page',
          verified: true,
        });
        recorded = true;
      } catch (err) {
        log.error('booking intent write failed (non-blocking)', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return NextResponse.json({ ok: true, recorded, demo: env.DEMO_MODE });
}
