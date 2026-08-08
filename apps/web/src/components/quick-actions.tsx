'use client';

import { useState } from 'react';

const ACTIONS = [
  { key: 'call', label: '📞 Call', destructive: true },
  { key: 'text', label: '💬 Text', destructive: true },
  { key: 'email', label: '✉️ Email', destructive: true },
  { key: 'book', label: '📅 Book', destructive: false },
  { key: 'assign', label: '👤 Assign', destructive: false },
  { key: 'move', label: '🧭 Move stage', destructive: false },
  { key: 'documents', label: '📁 Request docs', destructive: false },
  { key: 'follow_up', label: '⚡ Generate follow-up', destructive: false },
  { key: 'application', label: '📝 Start application', destructive: true },
  { key: 'closed', label: '✅ Mark closed', destructive: false },
  { key: 'referral', label: '🎁 Add referral', destructive: false },
];

export function QuickActions() {
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() =>
              setMsg(
                a.destructive
                  ? `"${a.label.replace(/^\S+\s/, '')}" is disabled in demo mode (outbound/irreversible action).`
                  : `Demo: "${a.label.replace(/^\S+\s/, '')}" would run through a workflow.`,
              )
            }
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10"
          >
            {a.label}
          </button>
        ))}
      </div>
      {msg && <p className="mt-2 text-xs text-yellow-300/90">{msg}</p>}
    </div>
  );
}
