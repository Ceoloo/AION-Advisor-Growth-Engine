import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Advisor Conversion Scorecard | AION',
  description:
    'Get your Advisor Conversion Infrastructure Score and see where prospects fall out between first contact and a qualified conversation. A marketing & sales diagnostic — not financial advice.',
};

export default function ScorecardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 sm:px-8">
        <Link href="/advisor-scorecard" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-semibold text-white">AION</span>
          <span className="hidden text-xs text-slate-500 sm:inline">Advisor Growth Engine</span>
        </Link>
        <span className="text-xs text-slate-500">Conversion Scorecard</span>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 px-4 py-5 text-center sm:px-8">
        <p className="mx-auto max-w-2xl text-[11px] leading-relaxed text-slate-500">
          This diagnostic evaluates your marketing and sales conversion process. It does not evaluate
          investment performance and does not provide financial, investment, legal, tax, or
          insurance-product advice.
        </p>
      </footer>
    </div>
  );
}
