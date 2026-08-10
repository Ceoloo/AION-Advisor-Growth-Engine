import Link from 'next/link';
import type { RuntimeMode } from '@aion/shared';

/**
 * Mode-aware environment banner. Demo and Pilot show an explicit notice so no
 * one mistakes the environment for full production; Production shows nothing.
 */
export function ModeBanner({ mode }: { mode: RuntimeMode }) {
  if (mode === 'demo') {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-brand-gold/20 bg-brand-gold/10 px-4 py-1.5 text-center text-xs text-yellow-200/90">
        <span aria-hidden>🧪</span>
        <span>
          <strong>Demo mode</strong> — seeded data, destructive &amp; outbound actions are disabled. Not
          for production use.{' '}
          <Link href="/mode" className="underline underline-offset-2 hover:text-yellow-100">
            Mode status
          </Link>
        </span>
      </div>
    );
  }

  if (mode === 'pilot') {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-center text-xs text-blue-200/90">
        <span aria-hidden>🚀</span>
        <span>
          <strong>Pilot mode</strong> — live data with controlled volume and human approval on outbound
          actions.{' '}
          <Link href="/mode" className="underline underline-offset-2 hover:text-blue-100">
            Mode status
          </Link>
        </span>
      </div>
    );
  }

  return null;
}

/** Backwards-compatible alias — demo-only banner. */
export function DemoBanner() {
  return <ModeBanner mode="demo" />;
}
