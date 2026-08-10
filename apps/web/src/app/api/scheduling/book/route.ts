import { NextResponse } from 'next/server';
import { BookingRequestSchema, generateSlots, pickRoundRobin } from '@aion/scheduling';
import { logger } from '@aion/shared';
import { getStore } from '@/lib/demo';
import { addBooking, busyForCalendar, countsByMember } from '@/lib/scheduling-store';
import { recordOps } from '@/lib/observability';

const DAY_MS = 86_400_000;

/**
 * Book a slot on a public calendar. Verifies the slot is still open, assigns a
 * team member via round-robin (or an explicit choice), and records the booking.
 * Idempotent by bookingId. In-memory / demo-safe — no external writes.
 */
export async function POST(request: Request) {
  const parsed = BookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_request', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const body = parsed.data;
  const found = getStore().findCalendarBySlug(body.calendarSlug);
  if (!found) return NextResponse.json({ ok: false, error: 'calendar_not_found' }, { status: 404 });

  const { calendar, org } = found;
  const start = new Date(body.startsAt);
  const now = new Date();

  // Re-derive availability around the requested time to confirm it is still open.
  const slots = generateSlots(calendar, {
    from: new Date(Math.max(now.getTime(), start.getTime() - DAY_MS)),
    to: new Date(start.getTime() + DAY_MS),
    now,
    busy: busyForCalendar(calendar),
    maxSlots: 500,
  });
  const slot = slots.find((s) => new Date(s.startsAt).getTime() === start.getTime());
  if (!slot) return NextResponse.json({ ok: false, error: 'slot_unavailable' }, { status: 409 });

  const member = pickRoundRobin({
    availableMemberIds: slot.availableMemberIds,
    countsByMember: countsByMember(org.organization.id, calendar.memberIds),
    preferredMemberId: body.memberId,
  });
  if (!member) return NextResponse.json({ ok: false, error: 'no_member_available' }, { status: 409 });

  const memberName = org.profiles.find((p) => p.id === member)?.fullName ?? 'Advisor';
  const endsAt = new Date(start.getTime() + calendar.slotMinutes * 60_000).toISOString();

  const { created, booking } = addBooking({
    bookingId: body.bookingId,
    organizationId: org.organization.id,
    calendarId: calendar.id,
    calendarName: calendar.name,
    memberId: member,
    title: `${calendar.name} with ${memberName}`,
    startsAt: slot.startsAt,
    endsAt,
    contactName: body.name,
    contactEmail: body.email,
    contactPhone: body.phone || undefined,
    notes: body.notes || undefined,
  });

  logger.child({ component: 'scheduling-book' }).info('booking recorded', {
    calendar: calendar.slug,
    member,
    created,
    startsAt: slot.startsAt,
  });

  if (created) {
    recordOps({
      component: 'booking',
      type: 'booking_event',
      status: 'success',
      retryCount: 1,
      message: `${calendar.name} booked (round-robin: ${memberName})`,
      correlationId: booking.bookingId,
    });
    // BOOKED → the advisor pre-call brief is generated.
    recordOps({
      component: 'workflows',
      type: 'workflow_execution',
      status: 'success',
      retryCount: 1,
      message: 'Pre-Call Advisor Brief generated on booking',
      correlationId: booking.bookingId,
    });
  }

  return NextResponse.json({
    ok: true,
    deduped: !created,
    booking: {
      calendarName: calendar.name,
      memberId: member,
      memberName,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      meetingLocation: calendar.meetingLocation ?? null,
    },
  });
}
