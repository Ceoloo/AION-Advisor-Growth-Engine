import { NextResponse } from 'next/server';
import { generateSlots, groupSlotsByDay } from '@aion/scheduling';
import { getStore } from '@/lib/demo';
import { busyForCalendar } from '@/lib/scheduling-store';

const DAY_MS = 86_400_000;

/** Public availability for a booking link (calendar slug). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? 14), 1), 60);
  if (!slug) return NextResponse.json({ ok: false, error: 'missing_slug' }, { status: 400 });

  const found = getStore().findCalendarBySlug(slug);
  if (!found) return NextResponse.json({ ok: false, error: 'calendar_not_found' }, { status: 404 });

  const { calendar, org } = found;
  const now = new Date();
  const from = now;
  const to = new Date(now.getTime() + days * DAY_MS);
  const slots = generateSlots(calendar, { from, to, now, busy: busyForCalendar(calendar), maxSlots: 200 });
  const grouped = groupSlotsByDay(slots, calendar.tzOffsetMinutes);

  const members = calendar.memberIds.map((id) => ({
    id,
    name: org.profiles.find((p) => p.id === id)?.fullName ?? 'Advisor',
  }));

  return NextResponse.json({
    ok: true,
    calendar: {
      name: calendar.name,
      slug: calendar.slug,
      type: calendar.type,
      slotMinutes: calendar.slotMinutes,
      timezoneLabel: calendar.timezoneLabel,
      tzOffsetMinutes: calendar.tzOffsetMinutes,
      description: calendar.description ?? null,
      meetingLocation: calendar.meetingLocation ?? null,
      members,
    },
    days: grouped,
  });
}
