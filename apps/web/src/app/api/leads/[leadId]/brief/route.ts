import { NextResponse } from 'next/server';
import { getLeadDetail } from '@/lib/demo';
import { preCallBriefForLead } from '@/lib/precall-brief';

/**
 * The pre-call Advisor Brief for a lead — the same deterministic prep sheet the
 * workflow generates at booking. Read-only, tenant-scoped by the demo store.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const detail = getLeadDetail(leadId);
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, leadId, brief: preCallBriefForLead(detail) });
}
