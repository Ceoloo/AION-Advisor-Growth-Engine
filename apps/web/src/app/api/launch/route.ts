import { NextResponse } from 'next/server';
import { getCapabilities } from '@aion/shared';
import { getActiveClient } from '@aion/clients';
import { evaluateLiveCampaignGate } from '@aion/compliance';

/**
 * Read-only launch-readiness status for the active client: the per-item approval
 * checklist, whether the client is LAUNCH ELIGIBLE, and whether live campaigns
 * are permitted (approvals complete AND the runtime mode allows live campaigns).
 */
export async function GET() {
  const client = getActiveClient();
  const caps = getCapabilities();
  const gate = evaluateLiveCampaignGate(client.launchApprovals ?? {}, caps);

  return NextResponse.json({
    ok: true,
    clientId: client.clientId,
    mode: caps.mode,
    launchEligible: gate.launchEligible,
    liveCampaignsAllowed: gate.allowed,
    reasons: gate.reasons,
    approvals: gate.readiness.items,
    approvedCritical: gate.readiness.approvedCritical,
    totalCritical: gate.readiness.totalCritical,
    timestamp: new Date().toISOString(),
  });
}
