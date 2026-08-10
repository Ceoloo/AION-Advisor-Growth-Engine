import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg, DEMO_ORG_ID } from '@/lib/demo';
import { listTeamCalendarEvents } from '@/lib/scheduling-store';

const DAY_MS = 86_400_000;
const MEMBER_COLORS = ['#3b82f6', '#10b981', '#d4af37', '#a855f7', '#f59e0b'];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDayLabel(d: Date): { dow: string; date: string } {
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  };
}

export default function TeamCalendarPage() {
  const org = getActiveOrg();
  const events = listTeamCalendarEvents(DEMO_ORG_ID);

  // Color per team member for at-a-glance ownership.
  const memberColor = new Map<string, string>();
  org.profiles.forEach((p, i) => memberColor.set(p.id, MEMBER_COLORS[i % MEMBER_COLORS.length]!));

  // 7-day view starting today (UTC).
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.startsAt.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  return (
    <>
      <PageHeader
        title="Team Calendar"
        description="One shared calendar across the whole team — every appointment and booking, color-coded by owner."
        actions={
          <Link
            href="/calendars"
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright"
          >
            Booking links
          </Link>
        }
      />

      {/* Member legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {org.profiles.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: memberColor.get(p.id) }} />
            {p.fullName}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[900px] grid-cols-7 gap-2">
          {days.map((d) => {
            const key = dayKey(d);
            const dayEvents = (byDay.get(key) ?? []).sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
            const label = fmtDayLabel(d);
            const isToday = key === dayKey(new Date());
            return (
              <div
                key={key}
                className={`flex flex-col rounded-xl border ${isToday ? 'border-brand-blue/40' : 'border-white/10'} bg-white/[0.02]`}
              >
                <div className="border-b border-white/10 px-3 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{label.dow}</p>
                  <p className={`text-sm font-semibold ${isToday ? 'text-brand-bright' : 'text-slate-200'}`}>
                    {label.date}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5 p-2">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-lg border-l-2 bg-white/[0.03] px-2 py-1.5"
                      style={{ borderColor: e.memberId ? memberColor.get(e.memberId) : '#64748b' }}
                    >
                      <p className="text-[11px] font-medium tabular-nums text-slate-300">{fmtTime(e.startsAt)}</p>
                      <p className="truncate text-xs text-white" title={e.title}>
                        {e.title}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {e.memberName ?? 'Unassigned'}
                        {e.source === 'booking' ? ' · booked' : ''}
                      </p>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className="px-1 py-4 text-center text-[11px] text-slate-600">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Showing {events.length} events. New bookings from your links appear here automatically (marked{' '}
        <Badge tone="green">booked</Badge>).
      </p>
    </>
  );
}
