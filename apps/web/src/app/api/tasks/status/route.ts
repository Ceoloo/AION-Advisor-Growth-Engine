import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TASK_STATUSES } from '@aion/scheduling';
import { setTaskStatus } from '@/lib/scheduling-store';

const BodySchema = z.object({ taskId: z.string().min(1), status: z.enum(TASK_STATUSES) });

/** Update a shared task's status (open / in_progress / done). */
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  setTaskStatus(parsed.data.taskId, parsed.data.status);
  return NextResponse.json({ ok: true });
}
