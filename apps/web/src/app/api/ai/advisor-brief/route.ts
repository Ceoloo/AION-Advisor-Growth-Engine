import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAdvisorBrief } from '@aion/ai';
import { getGateway } from '@/lib/ai';
import { getLeadDetail } from '@/lib/demo';

const BodySchema = z.object({ leadId: z.string() });

/** Generate an AI advisor call-prep brief for a lead (tenant-scoped read). */
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  }

  const detail = getLeadDetail(parsed.data.leadId);
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });
  }

  const summary = detail.qualification?.result?.needsSummary ?? 'No qualification summary available.';
  const gateway = getGateway();
  const brief = await generateAdvisorBrief(gateway, {
    leadSummary: summary,
    answers: detail.qualification?.answers ?? {},
  });

  if (!brief.ok) {
    return NextResponse.json({ ok: false, error: brief.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, data: brief.data });
}
