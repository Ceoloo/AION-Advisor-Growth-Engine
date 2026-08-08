'use client';

import { useState } from 'react';
import { Card, Badge } from '@aion/ui';
import { APPROVAL_CHECKLIST } from '@/lib/presentation';

export function ApprovalChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const total = APPROVAL_CHECKLIST.length;
  const done = Object.values(checked).filter(Boolean).length;
  const launchReady = done === total;

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">
            {done} / {total} approved
          </p>
          {launchReady ? (
            <Badge tone="green">Ready for launch sign-off</Badge>
          ) : (
            <Badge tone="amber">Not ready — sign-offs pending</Badge>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full ${launchReady ? 'bg-brand-green' : 'bg-brand-blue'}`}
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </Card>

      <div className="space-y-2">
        {APPROVAL_CHECKLIST.map((item) => {
          const isChecked = !!checked[item.key];
          return (
            <label
              key={item.key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#111a2e] p-4 hover:border-brand-blue/30"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setChecked((p) => ({ ...p, [item.key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-brand-blue"
              />
              <div>
                <p className={`text-sm font-medium ${isChecked ? 'text-brand-green' : 'text-white'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-slate-500">
        Internal checklist — this is a tracking aid, not a legal or compliance determination. Live
        GoHighLevel, AI, messaging, and production authentication remain disconnected until launch is
        approved.
      </p>
    </>
  );
}
