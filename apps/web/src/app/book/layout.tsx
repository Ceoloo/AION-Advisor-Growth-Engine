import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a meeting | AION',
  description: 'Pick a time that works for you.',
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center gap-2 border-b border-white/10 px-4 sm:px-8">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white">
          A
        </span>
        <span className="text-sm font-semibold text-white">AION Scheduling</span>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-slate-500">
        Powered by AION Advisor Growth Engine
      </footer>
    </div>
  );
}
