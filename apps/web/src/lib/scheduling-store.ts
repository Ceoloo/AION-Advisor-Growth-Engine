/**
 * Server-side runtime overlay for the native calendar system. The demo store is
 * deterministic and read-only; new bookings and task changes made while the app
 * runs live here (process-local, in-memory). This is fully demo-safe — nothing
 * is written to any external system. In production this layer is backed by the
 * database.
 */
import { getStore } from '@/lib/demo';
import type { BusyInterval, Calendar, SharedTask, TaskStatus } from '@aion/scheduling';
import { generateId } from '@aion/shared';

export interface RuntimeBooking {
  id: string;
  bookingId: string;
  organizationId: string;
  calendarId: string;
  calendarName: string;
  memberId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  status: 'scheduled';
  createdAt: string;
}

const bookings: RuntimeBooking[] = [];
const seenBookingIds = new Set<string>();
const runtimeTasks: SharedTask[] = [];
const taskStatusOverrides = new Map<string, TaskStatus>();

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  memberId?: string | null;
  memberName?: string | null;
  status: string;
  source: 'appointment' | 'booking';
  leadId?: string | null;
}

function memberName(orgId: string, memberId?: string | null): string | null {
  if (!memberId) return null;
  return getStore().org(orgId)?.profiles.find((p) => p.id === memberId)?.fullName ?? null;
}

// --- Bookings ---------------------------------------------------------------

export function addBooking(input: Omit<RuntimeBooking, 'id' | 'status' | 'createdAt'>): {
  created: boolean;
  booking: RuntimeBooking;
} {
  const existing = bookings.find((b) => b.bookingId === input.bookingId);
  if (existing || seenBookingIds.has(input.bookingId)) {
    return { created: false, booking: existing ?? { ...input, id: 'dup', status: 'scheduled', createdAt: '' } };
  }
  const booking: RuntimeBooking = {
    ...input,
    id: generateId('appt'),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  seenBookingIds.add(input.bookingId);
  return { created: true, booking };
}

export function listRuntimeBookings(organizationId: string): RuntimeBooking[] {
  return bookings.filter((b) => b.organizationId === organizationId);
}

/** Busy intervals for a calendar's members (demo appointments + runtime bookings). */
export function busyForCalendar(calendar: Calendar): BusyInterval[] {
  const org = getStore().org(calendar.organizationId);
  const members = new Set(calendar.memberIds);
  const out: BusyInterval[] = [];
  for (const a of org?.appointments ?? []) {
    if (a.advisorId && members.has(a.advisorId) && a.status !== 'cancelled') {
      out.push({ memberId: a.advisorId, startsAt: a.startsAt, endsAt: a.endsAt });
    }
  }
  for (const b of bookings) {
    if (b.organizationId === calendar.organizationId && members.has(b.memberId)) {
      out.push({ memberId: b.memberId, startsAt: b.startsAt, endsAt: b.endsAt });
    }
  }
  return out;
}

/** Appointment counts per member for round-robin balancing. */
export function countsByMember(organizationId: string, memberIds: string[]): Record<string, number> {
  const org = getStore().org(organizationId);
  const counts: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const a of org?.appointments ?? []) {
    if (a.advisorId && a.advisorId in counts) counts[a.advisorId] = (counts[a.advisorId] ?? 0) + 1;
  }
  for (const b of bookings) {
    if (b.organizationId === organizationId && b.memberId in counts) {
      counts[b.memberId] = (counts[b.memberId] ?? 0) + 1;
    }
  }
  return counts;
}

/** The shared team calendar: all appointments + bookings, normalized. */
export function listTeamCalendarEvents(organizationId: string): CalendarEvent[] {
  const org = getStore().org(organizationId);
  const contactName = (leadId?: string | null) => {
    if (!leadId) return null;
    const lead = org?.leads.find((l) => l.id === leadId);
    const c = lead && org?.contacts.find((x) => x.id === lead.contactId);
    return c ? `${c.firstName} ${c.lastName}` : null;
  };

  const fromAppts: CalendarEvent[] = (org?.appointments ?? []).map((a) => ({
    id: a.id,
    title: contactName(a.leadId) ? `${a.title} · ${contactName(a.leadId)}` : a.title,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    memberId: a.advisorId ?? null,
    memberName: memberName(organizationId, a.advisorId),
    status: a.status,
    source: 'appointment',
    leadId: a.leadId,
  }));

  const fromBookings: CalendarEvent[] = listRuntimeBookings(organizationId).map((b) => ({
    id: b.id,
    title: `${b.calendarName} · ${b.contactName}`,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    memberId: b.memberId,
    memberName: memberName(organizationId, b.memberId),
    status: 'scheduled',
    source: 'booking',
    leadId: null,
  }));

  return [...fromAppts, ...fromBookings].sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
}

// --- Shared tasks -----------------------------------------------------------

export function listSharedTasks(organizationId: string): SharedTask[] {
  const org = getStore().org(organizationId);
  const demo = (org?.sharedTasks ?? []).map((t) => ({
    ...t,
    status: taskStatusOverrides.get(t.id) ?? t.status,
  }));
  const runtime = runtimeTasks.filter((t) => t.organizationId === organizationId);
  const order = { open: 0, in_progress: 1, done: 2 } as const;
  return [...runtime, ...demo].sort((a, b) => {
    const s = order[a.status] - order[b.status];
    if (s !== 0) return s;
    return (a.dueAt ?? '') < (b.dueAt ?? '') ? -1 : 1;
  });
}

export function addSharedTask(input: {
  organizationId: string;
  title: string;
  assigneeId?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}): SharedTask {
  const now = new Date().toISOString();
  const task: SharedTask = {
    id: generateId('stask'),
    organizationId: input.organizationId,
    title: input.title,
    assigneeId: input.assigneeId ?? null,
    dueAt: input.dueAt ?? null,
    status: 'open',
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  runtimeTasks.unshift(task);
  return task;
}

export function setTaskStatus(taskId: string, status: TaskStatus): boolean {
  const runtime = runtimeTasks.find((t) => t.id === taskId);
  if (runtime) {
    runtime.status = status;
    runtime.updatedAt = new Date().toISOString();
    return true;
  }
  taskStatusOverrides.set(taskId, status);
  return true;
}
