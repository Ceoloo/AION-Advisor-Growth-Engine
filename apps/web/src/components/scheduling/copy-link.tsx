'use client';

import { useState } from 'react';

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const full = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
    >
      {copied ? 'Copied ✓' : 'Copy link'}
    </button>
  );
}
