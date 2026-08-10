# Native Scheduling (Calendars, Booking Links & Shared Tasks)

A GoHighLevel-style scheduling layer built natively into AION — round-robin
("round table") calendars, a shared team calendar, public booking links, and a
shared task board. Deterministic engine, demo-safe (in-memory), and provider-
agnostic (no dependency on an external scheduler).

## What it does

| Capability | Where |
| --- | --- |
| **Round-robin / collective / individual calendars** | `@aion/scheduling` (types + availability + assignment) |
| **Shared team calendar** (one view of everyone) | `/calendar` |
| **Book clients with links** (public booking pages) | `/calendars` (manage links) → `/book/[slug]` (public) |
| **Shared tasks** (assign, track, complete) | `/tasks` |

## Architecture (extends the existing app — no new framework/db/auth)

- **`@aion/scheduling`** (new pure package): calendar/availability/slot/task
  types; `generateSlots()` (weekly hours, slot size, buffers, min-notice,
  busy-aware, timezone offset); `pickRoundRobin()` (least-busy, deterministic).
- **Demo data**: each org seeds three calendars (round-robin Advisor Growth
  Review, collective Client Strategy Session, individual Intro) plus shared
  tasks (`@aion/database`). Store gains `listCalendars` and `findCalendarBySlug`.
- **Runtime overlay** (`apps/web/src/lib/scheduling-store.ts`): process-local,
  in-memory store for live bookings and task changes layered over the read-only
  demo data. Fully demo-safe — nothing is written externally. In production this
  is backed by the database.
- **APIs**: `GET /api/scheduling/slots`, `POST /api/scheduling/book` (round-robin
  assignment, idempotent by `bookingId`, re-verifies the slot), `GET|POST
  /api/tasks`, `POST /api/tasks/status`.
- **UI**: `/calendar` (7-day shared team view, color-coded by owner),
  `/calendars` (booking links + copy), public `/book/[slug]` (own layout, outside
  the `(app)` shell), `/tasks` (three-column board).

## Calendar types

- **round_robin** — a slot is offered if ≥1 member is free; the booking is
  assigned to the least-busy available member (ties broken by calendar order).
- **collective** — a slot is offered only when *all* members are free.
- **individual** — a single member's calendar.

## Availability model

Weekly windows per day-of-week (`"HH:MM"`), a fixed timezone offset
(`tzOffsetMinutes`, no DST — a documented simplification), slot length, buffer
(applied on both sides of busy intervals), and minimum notice. Busy intervals
come from existing appointments (by advisor) plus live bookings. Slot generation
is pure and deterministic for fixed inputs.

## Booking flow

1. Visitor opens `/book/<slug>` → `GET /api/scheduling/slots` returns open slots grouped by day.
2. They pick a time and enter name/email → `POST /api/scheduling/book`.
3. The server re-derives availability (guards against races), assigns a member
   via round-robin (or an explicit choice), records the booking (idempotent),
   and returns the assigned member + time.
4. The booking appears on the shared **Team Calendar** immediately (marked
   "booked").

## Demo / safety

Everything runs in-memory; there are **no external writes** and no live
messaging. Bookings and task changes persist for the life of the server process
(the deterministic demo data is regenerated on restart).

## QA checklist

- [ ] `/calendars` lists calendars with type badges and copyable `/book/<slug>` links.
- [ ] `/book/<slug>` shows open days/slots; unknown slug → not-found state.
- [ ] Booking assigns a member (round-robin) and shows a confirmation.
- [ ] Duplicate submit (same `bookingId`) is deduped.
- [ ] New booking appears on `/calendar`.
- [ ] `/tasks` create + status move works; demo tasks show with assignees/status.
- [ ] Mobile (390px) booking view is clean.

## Next steps (not built here)

Live calendar-provider sync (Google/Outlook) for two-way busy, email/SMS
confirmations through an approved channel, recurring availability with real DST,
and per-user booking pages.
