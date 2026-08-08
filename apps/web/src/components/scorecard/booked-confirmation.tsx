'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@aion/ui';
import { attributionToSourceUtm, captureAttribution } from '@/lib/scorecard-client';

export function BookedConfirmation({ submissionId }: { submissionId?: string }) {
  const [state, setState] = useState<'recording' | 'done'>('recording');

  useEffect(() => {
    const id = submissionId || 'unknown';
    void fetch('/api/scorecard/booking-confirmed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ submissionId: id, sourceUtm: attributionToSourceUtm(captureAttribution()) }),
    })
      .catch(() => {})
      .finally(() => setState('done'));
  }, [submissionId]);

  return (
    <Card className="p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/15 text-2xl">
        ✓
      </div>
      <h1 className="mt-4 text-xl font-semibold text-white">You’re booked</h1>
      <p className="mt-2 text-sm text-slate-400">
        Thanks — your 15-minute Advisor Growth Review is confirmed. We’ll walk through your score,
        pinpoint the biggest conversion leak, and show you the first workflow we’d improve.
      </p>
      <p className="mt-4 text-xs text-slate-500">
        {state === 'recording' ? 'Saving your confirmation…' : 'Confirmation recorded.'}
      </p>
      <Link
        href="/advisor-scorecard/proposal"
        className="mt-5 inline-flex rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright"
      >
        View my growth plan →
      </Link>
    </Card>
  );
}
