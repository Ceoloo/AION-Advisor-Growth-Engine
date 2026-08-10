/**
 * Deterministic availability / slot generation. Pure: given a calendar, a date
 * window, "now", and busy intervals, it returns the open slots. Timezone is
 * handled with a fixed offset (no DST) to keep the math reproducible and
 * dependency-free — documented as a simplification.
 */
import type { AvailableSlot, BusyInterval, Calendar } from './types.js';

const DAY_MS = 86_400_000;

export interface SlotOptions {
  from: Date;
  to: Date;
  now?: Date;
  busy?: BusyInterval[];
  maxSlots?: number;
}

function parseHhmm(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

interface Interval {
  start: number;
  end: number;
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Generate open slots for a calendar. Deterministic for fixed inputs. */
export function generateSlots(calendar: Calendar, opts: SlotOptions): AvailableSlot[] {
  const now = opts.now ?? new Date();
  const tz = calendar.tzOffsetMinutes * 60_000;
  const buffer = calendar.bufferMinutes * 60_000;
  const slotMs = calendar.slotMinutes * 60_000;
  const minNoticeCutoff = now.getTime() + calendar.minNoticeHours * 3_600_000;
  const maxSlots = opts.maxSlots ?? 500;

  // Busy intervals grouped by member (as epoch ms).
  const busyByMember = new Map<string, Interval[]>();
  for (const b of opts.busy ?? []) {
    const arr = busyByMember.get(b.memberId) ?? [];
    arr.push({ start: new Date(b.startsAt).getTime(), end: new Date(b.endsAt).getTime() });
    busyByMember.set(b.memberId, arr);
  }

  const memberFree = (memberId: string, slot: Interval): boolean => {
    const padded = { start: slot.start - buffer, end: slot.end + buffer };
    const intervals = busyByMember.get(memberId);
    if (!intervals) return true;
    return !intervals.some((iv) => overlaps(iv, padded));
  };

  const slots: AvailableSlot[] = [];

  // Iterate day-by-day in the calendar's local wall-clock space.
  const localFrom = opts.from.getTime() + tz;
  let localMidnight = Math.floor(localFrom / DAY_MS) * DAY_MS;
  const toMs = opts.to.getTime();

  for (let d = 0; d < 90 && slots.length < maxSlots; d++) {
    const realMidnight = localMidnight - tz;
    if (realMidnight > toMs) break;

    const dow = new Date(localMidnight).getUTCDay();
    const windows = calendar.availability[dow] ?? [];

    for (const w of windows) {
      const startMin = parseHhmm(w.start);
      const endMin = parseHhmm(w.end);
      for (let m = startMin; m + calendar.slotMinutes <= endMin; m += calendar.slotMinutes) {
        if (slots.length >= maxSlots) break;
        const utcStart = localMidnight + m * 60_000 - tz;
        const utcEnd = utcStart + slotMs;
        if (utcStart < minNoticeCutoff) continue;
        if (utcStart < opts.from.getTime() || utcEnd > toMs) continue;

        const slot: Interval = { start: utcStart, end: utcEnd };
        const available = calendar.memberIds.filter((id) => memberFree(id, slot));

        const include =
          calendar.type === 'collective'
            ? available.length === calendar.memberIds.length && available.length > 0
            : available.length >= 1;

        if (include) {
          slots.push({
            startsAt: new Date(utcStart).toISOString(),
            endsAt: new Date(utcEnd).toISOString(),
            availableMemberIds: available,
          });
        }
      }
    }
    localMidnight += DAY_MS;
  }

  return slots;
}

/** Group slots by local (calendar-tz) day key "YYYY-MM-DD" for UI rendering. */
export function groupSlotsByDay(
  slots: AvailableSlot[],
  tzOffsetMinutes: number,
): { day: string; slots: AvailableSlot[] }[] {
  const tz = tzOffsetMinutes * 60_000;
  const map = new Map<string, AvailableSlot[]>();
  for (const s of slots) {
    const local = new Date(new Date(s.startsAt).getTime() + tz);
    const key = local.toISOString().slice(0, 10);
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, slots]) => ({ day, slots }));
}
