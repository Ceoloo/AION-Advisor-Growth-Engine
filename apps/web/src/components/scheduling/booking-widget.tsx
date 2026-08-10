'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from '@aion/ui';

interface Slot {
  startsAt: string;
  endsAt: string;
  availableMemberIds: string[];
}
interface DayGroup {
  day: string;
  slots: Slot[];
}
interface CalendarInfo {
  name: string;
  slug: string;
  type: 'round_robin' | 'collective' | 'individual';
  slotMinutes: number;
  timezoneLabel: string;
  tzOffsetMinutes: number;
  description: string | null;
  meetingLocation: string | null;
  members: { id: string; name: string }[];
}

const TYPE_NOTE: Record<string, string> = {
  round_robin: 'The next available team member will be assigned to your meeting.',
  collective: 'You’ll meet with the full team on this calendar.',
  individual: '',
};

function newBookingId() {
  const r = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `bk_${r}`;
}

export function BookingWidget({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<'loading' | 'pick' | 'form' | 'booking' | 'confirmed' | 'notfound' | 'error'>('loading');
  const [cal, setCal] = useState<CalendarInfo | null>(null);
  const [days, setDays] = useState<DayGroup[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [confirm, setConfirm] = useState<{ memberName: string; startsAt: string; meetingLocation: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bookingId = useMemo(newBookingId, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/scheduling/slots?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) return setPhase('notfound');
        const json = await res.json();
        if (!json.ok) return setPhase('error');
        setCal(json.calendar);
        setDays(json.days ?? []);
        setPhase('pick');
      } catch {
        setPhase('error');
      }
    })();
  }, [slug]);

  const fmtTime = (iso: string) => {
    if (!cal) return '';
    const local = new Date(new Date(iso).getTime() + cal.tzOffsetMinutes * 60_000);
    return local.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  };
  const fmtDay = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

  if (phase === 'loading') return <Card className="p-10 text-center text-sm text-slate-400">Loading availability…</Card>;
  if (phase === 'notfound')
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-semibold text-white">Booking link not found</p>
        <p className="mt-1 text-sm text-slate-400">This calendar may be inactive or the link is incorrect.</p>
      </Card>
    );
  if (phase === 'error' || !cal)
    return <Card className="p-10 text-center text-sm text-red-300">Something went wrong loading this calendar.</Card>;

  if (phase === 'confirmed' && confirm)
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/15 text-2xl">✓</div>
        <h1 className="mt-4 text-xl font-semibold text-white">You’re booked</h1>
        <p className="mt-2 text-sm text-slate-300">
          {cal.name} with <strong className="text-white">{confirm.memberName}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {fmtDay(confirm.startsAt.slice(0, 10))} at {fmtTime(confirm.startsAt)} ({cal.timezoneLabel})
        </p>
        {confirm.meetingLocation && <p className="mt-2 text-xs text-slate-500">{confirm.meetingLocation}</p>}
        <p className="mt-4 text-xs text-slate-500">A confirmation would be emailed in a live deployment.</p>
      </Card>
    );

  const currentDay = days[dayIdx];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">{cal.name}</h1>
        {cal.description && <p className="mt-1 text-sm text-slate-400">{cal.description}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge tone="blue">{cal.slotMinutes} min</Badge>
          <Badge tone="neutral">{cal.timezoneLabel}</Badge>
          {cal.meetingLocation && <Badge tone="neutral">{cal.meetingLocation}</Badge>}
        </div>
        {TYPE_NOTE[cal.type] && <p className="mt-2 text-xs text-slate-500">{TYPE_NOTE[cal.type]}</p>}
      </div>

      {phase === 'pick' && (
        <Card className="p-4">
          {days.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No open times in the next two weeks.</p>
          ) : (
            <>
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button
                    key={d.day}
                    onClick={() => setDayIdx(i)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                      i === dayIdx ? 'bg-brand-blue text-white' : 'border border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    {fmtDay(d.day)}
                    <span className="ml-1 opacity-70">({d.slots.length})</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {currentDay?.slots.map((s) => (
                  <button
                    key={s.startsAt}
                    onClick={() => {
                      setSlot(s);
                      setPhase('form');
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-slate-200 hover:border-brand-blue hover:bg-brand-blue/10"
                  >
                    {fmtTime(s.startsAt)}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {phase === 'form' && slot && (
        <Card className="p-5">
          <button onClick={() => setPhase('pick')} className="mb-3 text-sm text-slate-400 hover:text-slate-200">
            ← Change time
          </button>
          <p className="mb-3 text-sm text-slate-300">
            {fmtDay(slot.startsAt.slice(0, 10))} at <strong className="text-white">{fmtTime(slot.startsAt)}</strong> ({cal.timezoneLabel})
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return;
              setPhase('booking');
              setError(null);
              try {
                const res = await fetch('/api/scheduling/book', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    calendarSlug: cal.slug,
                    startsAt: slot.startsAt,
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim() || undefined,
                    notes: form.notes.trim() || undefined,
                    bookingId,
                  }),
                });
                const json = await res.json();
                if (!res.ok || !json.ok) throw new Error(json.error ?? 'booking_failed');
                setConfirm({
                  memberName: json.booking.memberName,
                  startsAt: json.booking.startsAt,
                  meetingLocation: json.booking.meetingLocation,
                });
                setPhase('confirmed');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Booking failed');
                setPhase('form');
              }
            }}
            className="space-y-3"
          >
            <input
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-blue"
            />
            <input
              placeholder="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-blue"
            />
            <input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-blue"
            />
            <textarea
              placeholder="What would you like to cover? (optional)"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-blue"
            />
            {error && <p className="text-sm text-red-400">{error === 'slot_unavailable' ? 'That time was just taken — please pick another.' : error}</p>}
            <button type="submit" className="w-full rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright">
              Confirm booking
            </button>
          </form>
        </Card>
      )}

      {phase === 'booking' && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-brand-blue" />
          Booking your time…
        </Card>
      )}
    </div>
  );
}
