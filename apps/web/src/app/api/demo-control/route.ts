import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadEnv } from '@aion/shared';
import { applyDemoControl, getPresentationState } from '@/lib/presentation-state';

/** Current presentation control state. */
export async function GET() {
  return NextResponse.json({ ok: true, demoMode: loadEnv().DEMO_MODE, state: getPresentationState() });
}

const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('reset_marcus') }),
  z.object({ type: z.literal('seed_stage'), stage: z.number().int().min(0).max(12) }),
  z.object({ type: z.literal('set_external_sending'), enabled: z.boolean() }),
  z.object({ type: z.literal('restore') }),
]);

/**
 * Demo-control actions: reset Marcus, seed at a stage, toggle external sending,
 * restore state. External sending stays a no-op regardless — demo mode blocks
 * all real outbound at the compliance layer; this flag is presenter-facing only.
 */
export async function POST(request: Request) {
  const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 422 });
  }
  const state = applyDemoControl(parsed.data);
  return NextResponse.json({ ok: true, state });
}
