import Link from 'next/link';
import { MODE_LABEL, type RuntimeMode } from '@aion/shared';

const STYLES: Record<RuntimeMode, { icon: string; className: string }> = {
  demo: { icon: '🧪', className: 'border-brand-gold/30 bg-brand-gold/10 text-yellow-200/90' },
  pilot: { icon: '🚀', className: 'border-brand-blue/30 bg-brand-blue/10 text-blue-200/90' },
  production: { icon: '🌐', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90' },
};

/** Compact runtime-mode pill for the top bar; links to the governance page. */
export function ModeBadge({ mode }: { mode: RuntimeMode }) {
  const s = STYLES[mode];
  return (
    <Link
      href="/mode"
      title="Runtime mode — Demo → Pilot → Production"
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${s.className}`}
    >
      <span aria-hidden>{s.icon}</span>
      {MODE_LABEL[mode]}
    </Link>
  );
}
