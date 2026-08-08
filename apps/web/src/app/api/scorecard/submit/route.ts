import { NextResponse } from 'next/server';
import { SubmissionSchema, computeScorecard } from '@aion/scorecard';
import { resolveAdvisorGrowthReviewBooking } from '@aion/integrations';
import { syncScorecardSubmission } from '@/lib/scorecard-sync';

/**
 * Scorecard submission: validate → deterministically score → best-effort CRM
 * sync (skipped in demo mode) → return the full personalized report plus the
 * booking target. Scoring is authoritative on the server; the client never
 * decides the score. Airtable secrets never leave the server.
 */
export async function POST(request: Request) {
  const parsed = SubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_submission', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const submission = parsed.data;
  const result = computeScorecard(submission.answers);

  // Best-effort CRM sync — never blocks the visitor's report.
  const sync = await syncScorecardSubmission(submission, result);
  const booking = resolveAdvisorGrowthReviewBooking();

  return NextResponse.json({
    ok: true,
    result,
    booking: { configured: booking.configured, url: booking.url },
    demo: sync.demo,
  });
}
