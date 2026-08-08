'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@aion/ui';
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/nav';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-navy/60 px-3 py-4 lg:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white">
          A
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">AION</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Growth Engine</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group}
            </p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-brand-blue/15 font-medium text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                      )}
                    >
                      <span aria-hidden className="text-base">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        href="/demo"
        className="mt-4 rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-3 py-2 text-xs text-yellow-200/90 hover:bg-brand-gold/10"
      >
        ✨ Guided demo walkthrough →
      </Link>
    </aside>
  );
}
