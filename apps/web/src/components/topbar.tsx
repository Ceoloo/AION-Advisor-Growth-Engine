import Link from 'next/link';
import { initials } from '@/lib/format';

export function TopBar({ orgName, userName }: { orgName: string; userName: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-navy/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white">
            A
          </span>
        </Link>
        <div>
          <p className="text-sm font-semibold text-white">{orgName}</p>
          <p className="text-[11px] text-slate-500">Advisor Growth Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          All systems operational
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue/20 text-xs font-semibold text-blue-200">
            {initials(userName)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium text-slate-200">{userName}</p>
            <p className="text-[10px] text-slate-500">Agency Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
