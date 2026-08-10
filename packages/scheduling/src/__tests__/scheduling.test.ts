import { describe, expect, it } from 'vitest';
import { generateSlots, groupSlotsByDay } from '../availability.js';
import { pickRoundRobin } from '../round-robin.js';
import type { Calendar } from '../types.js';

// A Monday–Friday 9–12 UTC calendar with two members, 30-min slots.
function cal(overrides: Partial<Calendar> = {}): Calendar {
  return {
    id: 'cal1',
    organizationId: 'org1',
    name: 'Growth Review',
    slug: 'growth-review',
    type: 'round_robin',
    memberIds: ['a', 'b'],
    slotMinutes: 30,
    bufferMinutes: 0,
    minNoticeHours: 0,
    tzOffsetMinutes: 0,
    timezoneLabel: 'UTC',
    availability: { 1: [{ start: '09:00', end: '12:00' }] },
    isActive: true,
    ...overrides,
  };
}

// A known Monday in UTC.
const MON = new Date('2026-08-10T00:00:00Z'); // 2026-08-10 is a Monday
const now = new Date('2026-08-09T00:00:00Z');
const to = new Date('2026-08-11T00:00:00Z');

describe('generateSlots', () => {
  it('generates slot-sized openings within weekly windows', () => {
    const slots = generateSlots(cal(), { from: MON, to, now });
    // 09:00–12:00 in 30-min steps = 6 slots on Monday.
    expect(slots).toHaveLength(6);
    expect(slots[0]!.startsAt).toBe('2026-08-10T09:00:00.000Z');
    expect(slots[0]!.endsAt).toBe('2026-08-10T09:30:00.000Z');
    expect(slots[0]!.availableMemberIds).toEqual(['a', 'b']);
  });

  it('respects busy intervals (buffer-aware) per member', () => {
    const slots = generateSlots(cal({ bufferMinutes: 15 }), {
      from: MON,
      to,
      now,
      busy: [{ memberId: 'a', startsAt: '2026-08-10T09:00:00Z', endsAt: '2026-08-10T09:30:00Z' }],
    });
    // 09:00 slot: 'a' busy → only 'b'. Still bookable (round robin).
    const nine = slots.find((s) => s.startsAt === '2026-08-10T09:00:00.000Z')!;
    expect(nine.availableMemberIds).toEqual(['b']);
  });

  it('collective calendars require ALL members free', () => {
    const slots = generateSlots(cal({ type: 'collective' }), {
      from: MON,
      to,
      now,
      busy: [{ memberId: 'a', startsAt: '2026-08-10T09:00:00Z', endsAt: '2026-08-10T09:30:00Z' }],
    });
    // 09:00 excluded because 'a' is busy; 09:30 included.
    expect(slots.find((s) => s.startsAt === '2026-08-10T09:00:00.000Z')).toBeUndefined();
    expect(slots.find((s) => s.startsAt === '2026-08-10T09:30:00.000Z')).toBeDefined();
  });

  it('enforces minimum notice', () => {
    const slots = generateSlots(cal({ minNoticeHours: 48 }), { from: MON, to, now });
    // now = Sun 00:00; +48h = Tue 00:00 → all Monday slots filtered out.
    expect(slots).toHaveLength(0);
  });

  it('honors a timezone offset', () => {
    // UTC-4: local 09:00 window → 13:00 UTC.
    const slots = generateSlots(cal({ tzOffsetMinutes: -240 }), {
      from: new Date('2026-08-10T00:00:00Z'),
      to: new Date('2026-08-11T12:00:00Z'),
      now,
    });
    expect(slots[0]!.startsAt).toBe('2026-08-10T13:00:00.000Z');
  });

  it('groups slots by local day', () => {
    const slots = generateSlots(cal(), { from: MON, to, now });
    const grouped = groupSlotsByDay(slots, 0);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]!.day).toBe('2026-08-10');
    expect(grouped[0]!.slots).toHaveLength(6);
  });
});

describe('pickRoundRobin', () => {
  it('picks the least-busy available member', () => {
    expect(pickRoundRobin({ availableMemberIds: ['a', 'b'], countsByMember: { a: 3, b: 1 } })).toBe('b');
  });
  it('breaks ties by calendar order', () => {
    expect(pickRoundRobin({ availableMemberIds: ['a', 'b'], countsByMember: { a: 2, b: 2 } })).toBe('a');
  });
  it('honors an explicit preferred member when available', () => {
    expect(
      pickRoundRobin({ availableMemberIds: ['a', 'b'], preferredMemberId: 'b', countsByMember: { a: 0, b: 9 } }),
    ).toBe('b');
  });
  it('returns null when nobody is available', () => {
    expect(pickRoundRobin({ availableMemberIds: [] })).toBeNull();
  });
  it('is deterministic', () => {
    const input = { availableMemberIds: ['a', 'b', 'c'], countsByMember: { a: 5, b: 2, c: 2 } };
    expect(pickRoundRobin(input)).toBe(pickRoundRobin(input));
    expect(pickRoundRobin(input)).toBe('b');
  });
});
