import { NextResponse } from 'next/server';
import {
  SubmissionSchema,
  computeScorecard,
  generateAdvisorBrief,
  renderAdvisorBriefText,
} from '@aion/scorecard';

/**
 * Internal Advisor Brief generator. Deterministic; returns the structured brief
 * for a submission. This is for internal sales use — it does NOT send anything
 * externally. (In a hardened deployment, gate this behind auth / CRON_SECRET.)
 */
export async function POST(request: Request) {
  const parsed = SubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_submission' }, { status: 422 });
  }
  const submission = parsed.data;
  const result = computeScorecard(submission.answers);
  const brief = generateAdvisorBrief(submission.contact, result, submission.attribution);
  return NextResponse.json({ ok: true, brief, text: renderAdvisorBriefText(brief) });
}
