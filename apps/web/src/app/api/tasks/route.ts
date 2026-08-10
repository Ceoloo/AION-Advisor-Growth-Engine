import { NextResponse } from 'next/server';
import { SharedTaskInputSchema } from '@aion/scheduling';
import { DEMO_ORG_ID } from '@/lib/demo';
import { addSharedTask, listSharedTasks } from '@/lib/scheduling-store';

/** List shared team tasks for the active organization. */
export async function GET() {
  return NextResponse.json({ ok: true, tasks: listSharedTasks(DEMO_ORG_ID) });
}

/** Create a shared team task. */
export async function POST(request: Request) {
  const parsed = SharedTaskInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_task' }, { status: 422 });
  }
  const task = addSharedTask({ organizationId: DEMO_ORG_ID, ...parsed.data });
  return NextResponse.json({ ok: true, task });
}
