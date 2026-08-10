import { NextResponse } from 'next/server';
import { getCapabilities, isDemoMode } from '@aion/shared';
import { computeSystemHealth } from '@aion/observability';
import { opsRecorder } from '@/lib/observability';

/**
 * AION System Health — a read-only 🟢/🟡/🔴 roll-up of operational telemetry
 * across the eight subsystems, plus the recent event window (structured logs,
 * retry counts, failures, dead-letters).
 */
export async function GET() {
  const demo = isDemoMode();
  const caps = getCapabilities();
  const recorder = opsRecorder();

  const health = computeSystemHealth(recorder.all(), {
    demo,
    baselineDetail: {
      ghl: caps.simulateGHL ? 'Simulated (mock services) — healthy' : 'Live',
      airtable: caps.allowProductionCrmWrites ? 'Live CRM writes enabled' : 'Writes suppressed in current mode',
      ai: caps.useMockAI ? 'Mock provider — healthy' : 'Live provider',
    },
  });

  return NextResponse.json({
    ok: true,
    level: health.level,
    light: health.light,
    mode: caps.mode,
    components: health.components,
    events: recorder.list({ limit: 25 }),
    eventCount: health.eventCount,
    generatedAt: health.generatedAt,
  });
}
