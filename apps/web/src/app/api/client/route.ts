import { NextResponse } from 'next/server';
import { getActiveClient, listClients, isClientLiveApproved } from '@aion/clients';

/**
 * Read-only view of the client configuration layer: the active client plus the
 * full roster of registered advisors. This is what makes AION a product rather
 * than a single-client project — each advisor is a config on the same engine.
 *
 * Read-only by design: the active client is selected by the AION_ACTIVE_CLIENT
 * deployment env var, not over HTTP.
 */
export async function GET() {
  const active = getActiveClient();
  return NextResponse.json({
    ok: true,
    activeClientId: active.clientId,
    clients: listClients().map((c) => ({
      clientId: c.clientId,
      organizationId: c.organizationId,
      displayName: c.displayName,
      vertical: c.vertical,
      advisor: { name: c.advisor.name, title: c.advisor.title },
      approvalStatus: c.approval.status,
      complianceStatus: c.compliance.status,
      liveApproved: isClientLiveApproved(c),
      isActive: c.clientId === active.clientId,
    })),
    timestamp: new Date().toISOString(),
  });
}
