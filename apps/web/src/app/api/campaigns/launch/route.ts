import { NextResponse } from 'next/server';
import { AppError, getCapabilities, logger } from '@aion/shared';
import { getActiveClient } from '@aion/clients';
import { assertLiveCampaignAllowed, evaluateLiveCampaignGate } from '@aion/compliance';

/**
 * Launch (enable) a live campaign. This is the enforcement boundary: the request
 * is REFUSED unless the active client is launch-eligible (every critical
 * approval complete) AND the runtime mode permits live campaigns. There is no
 * bypass flag — the gate runs server-side before anything is enabled.
 */
export async function POST() {
  const client = getActiveClient();
  const caps = getCapabilities();
  const log = logger.child({ component: 'campaign-launch', clientId: client.clientId });

  try {
    // Hard gate. Throws AppError('live_campaign_blocked') when not permitted.
    assertLiveCampaignAllowed(client.launchApprovals ?? {}, caps);
  } catch (err) {
    if (err instanceof AppError) {
      const gate = evaluateLiveCampaignGate(client.launchApprovals ?? {}, caps);
      log.warn('live campaign launch blocked', { reasons: gate.reasons });
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message, reasons: gate.reasons },
        { status: err.status },
      );
    }
    throw err;
  }

  // Eligible + capability-permitted. In demo/pilot this never runs (blocked
  // above); in a real production deployment this is where the live campaign
  // would be enabled via the CRM.
  log.info('live campaign launch permitted');
  return NextResponse.json({ ok: true, launched: true, clientId: client.clientId });
}
