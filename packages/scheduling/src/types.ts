/**
 * Scheduling domain types — a native, GoHighLevel-style calendar layer:
 * round-robin ("round table"), collective, and individual calendars with weekly
 * availability, public booking links, generated slots, and shared tasks.
 *
 * Times in weekly availability are "HH:MM" and are interpreted in the calendar's
 * timezone offset (`tzOffsetMinutes`, minutes to ADD to UTC) so slot math stays
 * deterministic without a timezone library.
 */
import { z } from 'zod';

export type CalendarType = 'round_robin' | 'collective' | 'individual';

/** Weekly availability keyed by day of week (0 = Sunday … 6 = Saturday). */
export interface DayWindow {
  start: string; // "09:00"
  end: string; // "17:00"
}
export type WeeklyAvailability = Partial<Record<number, DayWindow[]>>;

export interface Calendar {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  type: CalendarType;
  /** Profile ids of the team members on this calendar. */
  memberIds: string[];
  slotMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  /** Minutes to add to UTC to get the calendar's local time (e.g. -240 = EDT). */
  tzOffsetMinutes: number;
  timezoneLabel: string;
  availability: WeeklyAvailability;
  meetingLocation?: string;
  description?: string;
  isActive: boolean;
}

export interface BusyInterval {
  startsAt: string; // ISO
  endsAt: string; // ISO
  memberId: string;
}

export interface AvailableSlot {
  startsAt: string; // ISO (UTC)
  endsAt: string; // ISO (UTC)
  /** Members free for this slot (candidates for round-robin assignment). */
  availableMemberIds: string[];
}

// --- Booking ----------------------------------------------------------------

export const BookingRequestSchema = z.object({
  calendarSlug: z.string().min(1).max(120),
  startsAt: z.string().datetime(),
  /** Optional explicit member (else round-robin picks). */
  memberId: z.string().max(100).optional(),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('A valid email is required').max(200),
  phone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  /** Client-generated id for idempotent double-submit protection. */
  bookingId: z.string().min(6).max(100),
});
export type BookingRequest = z.infer<typeof BookingRequestSchema>;

// --- Shared tasks -----------------------------------------------------------

export const TASK_STATUSES = ['open', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const SharedTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  assigneeId: z.string().max(100).optional(),
  dueAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});
export type SharedTaskInput = z.infer<typeof SharedTaskInputSchema>;

export interface SharedTask {
  id: string;
  organizationId: string;
  title: string;
  assigneeId?: string | null;
  dueAt?: string | null;
  status: TaskStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
