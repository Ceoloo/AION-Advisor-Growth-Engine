import { NextResponse } from 'next/server';
import { resolveRuntimeMode } from '@aion/shared';

/**
 * Read-only runtime-mode status. Exposes the resolved mode, the requested mode,
 * effective capabilities, and every activation gate with its pass/fail state so
 * operators can see exactly what is blocking a promotion.
 *
 * This endpoint is deliberately read-only: there is NO way to flip the system
 * live over HTTP. Promotion happens only by setting the gated environment
 * signals in the deployment (see docs/environments.md).
 */
export async function GET() {
  const r = resolveRuntimeMode();
  return NextResponse.json({
    ok: true,
    requestedMode: r.requestedMode,
    effectiveMode: r.effectiveMode,
    demoLocked: r.demoLocked,
    pilotReady: r.pilotReady,
    productionReady: r.productionReady,
    capabilities: r.capabilities,
    pilotChecks: r.pilotChecks,
    productionChecks: r.productionChecks,
    blockers: r.blockers,
    timestamp: new Date().toISOString(),
  });
}
