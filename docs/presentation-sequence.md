# Ben Peretz Pilot — Presentation Sequence

The exact run-of-show for presenting the pilot to Ben Peretz. The full journey is
**under five minutes**, runs **fully offline** on seeded data, and works on
**desktop and mobile**. No live GoHighLevel, AI, messaging, or production auth is
connected.

Backup screenshots of every stage are in
[`docs/presentation/screenshots`](presentation/screenshots) in case of any
on-site connectivity issue — you can present from the images alone.

## Before you start (30 seconds)

1. `pnpm install && pnpm --filter @aion/web dev` (or `build` + `start`).
2. Open **`/demo-control`** → click **Restore demo state**. Confirm
   **External sending: DISABLED (safe)**.
3. Open **`/presentation`**. You'll see Ben's branding, Marcus Johnson, and the
   12 stage buttons.

## Opening line

> "Ben, the core system is already built and tested. What I'm proposing is a
> customized pilot configured around your audience, compliance requirements,
> calendar, follow-up process, and approved messaging."

## The walkthrough (≈ 3–4 minutes)

Click **▶ Start walkthrough**, then **Next →** through each stage. Each stage has
a screenshot of the same name.

| # | Stage | Say this | Screenshot |
| --- | --- | --- | --- |
| 1 | Financial Protection Checkup | "A prospect, Marcus, finds your branded checkup — from an ad, referral, or QR code." | `stage-01.png` |
| 2 | Contact Capture & Consent | "We capture his details and SMS/email/call consent up front. Nothing goes out without it." | `stage-02.png` |
| 3 | Qualification Answers | "He answers a short needs assessment — income, assets, timeline, protection and estate needs." | `stage-03.png` |
| 4 | Deterministic Score | "The engine returns **86** — same rules for every lead, explainable and reproducible for compliance." | `stage-04.png` |
| 5 | High-Priority Classification | "An 86 is High Priority and gets tagged and routed for immediate personal follow-up." | `stage-05.png` |
| 6 | Personalized Education | "Marcus instantly gets educational resources tailored to his answers — value before the call." | `stage-06.png` |
| 7 | CRM Lead Created | "A CRM lead is created and assigned to you, with everything attached. In production this is your GoHighLevel." | `stage-07.png` |
| 8 | Pipeline Movement | "He moves into your pipeline at the Appointment Booked stage." | `stage-08.png` |
| 9 | Follow-Up Simulation | "The follow-up runs — but external sending is off in the demo, so nothing actually leaves." | `stage-09.png` |
| 10 | Appointment Booked | "Marcus books a Financial Protection Review on your calendar." | `stage-10.png` |
| 11 | Advisor Preparation Brief | "You get an AI prep brief — talking points, objections, compliance reminders. Click **Generate**." | `stage-11.png` |
| 12 | Dashboard Update | "And every step you just saw moved the executive dashboard in real time." | `stage-12.png` |

On stage 11, click **Generate** live — the brief appears instantly (mock AI
provider, fully offline). Note the compliance reminder and "advisor review
required."

## The close (≈ 1 minute)

1. Open **Pricing** (`/presentation/pricing`).
   - **Pilot: $4,500 setup + $997/month** — the recommended starting point.
   - **Growth System: $7,500 setup + $1,497/month** — the fuller build.
   - Frame it: "This is a customized deployment of an already-built, tested
     operating system — infrastructure, workflows, intelligence, reporting, and
     support — not just a page and some automations." (`pricing.png`)
2. Open **Approval Checklist** (`/presentation/checklist`) — walk the nine
   sign-offs (branding, biography, licensing, compliance, communications, data
   handling, CRM, calendar, launch approval). "Nothing goes live until you sign
   off on each of these." (`approval-checklist.png`)

## Demo-control cheat sheet

`/demo-control` lets you run the demo repeatedly and safely:

- **Reset Marcus** — return his journey pointer to the start.
- **Seed Marcus at a stage** — jump straight to any of the 12 stages (e.g. start
  at stage 4 to open on the score).
- **Disable external sending** — reaffirm the safe state (it is always off in
  demo mode regardless; the compliance layer blocks all real outbound).
- **Restore demo state** — full reset before the next run.

## Safety guarantees

- Demo mode banner is always visible.
- External/destructive actions (send SMS/email, place call, submit application,
  push to GHL, delete, export) are blocked by the compliance layer.
- Marcus and all data are deterministic and regenerated identically every run.
- No network calls leave the machine; the AI brief uses the offline mock
  provider.

## Files

- Screenshots: `docs/presentation/screenshots/*.png` (20 images).
- Journey data & content: `apps/web/src/lib/presentation.ts`.
- Marcus lead (deterministic): `packages/database/src/demo/seed.ts`
  (`buildMarcusJohnson`), guarded by `packages/database/src/__tests__/marcus-journey.test.ts`.
