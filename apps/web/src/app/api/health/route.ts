import { NextResponse } from 'next/server';
import { listAdapters } from '@aion/integrations';
import { loadEnv } from '@aion/shared';

/** Integration + service health snapshot for the observability dashboard. */
export async function GET() {
  const env = loadEnv();
  const adapters = await Promise.all(listAdapters().map((a) => a.healthCheck()));

  return NextResponse.json({
    ok: true,
    service: 'web',
    demoMode: env.DEMO_MODE,
    aiProvider: env.AI_PROVIDER,
    integrations: adapters,
    timestamp: new Date().toISOString(),
  });
}
