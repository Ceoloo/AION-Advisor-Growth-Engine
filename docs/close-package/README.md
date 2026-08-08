# Close Package — Ben Peretz Pilot

Everything to have ready before the call. All dollar figures match the in-app
pricing screen. **Drafts are templates for you (CeoLyfestyle LLC) to review and
customize — fill every `[bracket]` before sending. Nothing here is executed.**

| Item | Where |
| --- | --- |
| Pilot scope | [`pilot-scope.md`](pilot-scope.md) |
| Pricing + expanded anchor | this file (below) + `/presentation/pricing` |
| Required approvals checklist | [`../presentation-sequence.md`](../presentation-sequence.md) + `/presentation/checklist` |
| Information needed from Ben | this file (below) |
| Agreement draft | [`agreement-draft.md`](agreement-draft.md) |
| Setup invoice draft | [`setup-invoice-draft.md`](setup-invoice-draft.md) |
| Proposed kickoff date | this file (below) |
| Presentation run-of-show | [`../presentation-sequence.md`](../presentation-sequence.md) |
| Backup screenshots | [`../presentation/screenshots`](../presentation/screenshots) |

## Pricing (anchor high, sell the Pilot)

Lead with the **Growth System** as the anchor, then land on the **Pilot** as the
sensible starting point.

| | Growth System (anchor) | **Pilot (recommended)** |
| --- | --- | --- |
| Setup | $7,500 | **$4,500** |
| Monthly | $1,497 | **$997** |
| Position | The full growth system | A customized deployment of the already-built system |

Script: *"The full Growth System is $7,500 to set up and $1,497 a month. For the
pilot, we scope it down to what proves value for your practice — $4,500 to set
up and $997 a month."*

## Proposed kickoff date

- **Target kickoff: Monday, August 18, 2026** (approx. one week out; adjust live).
- Contingent on: signed agreement + setup invoice paid, and the required
  approvals returned.
- Setup window: ~5–7 business days from kickoff to a live, approved pilot.
- Pilot term: 90 days, then month-to-month.

Suggested close: *"If we get the agreement signed and setup handled this week, I
can have your pilot configured and ready for approval by the following week —
let's target kickoff Monday the 18th."*

## Information needed from Ben (to configure the pilot)

Branding & identity
- [ ] Practice name, logo, and brand colors
- [ ] Ben's bio, headshot, and credentials/designations
- [ ] Domain/subdomain for the checkup (or use a provided one)

Licensing & compliance
- [ ] States and product lines in scope (life, disability, annuities, etc.)
- [ ] License numbers per state
- [ ] Any required disclosures / carrier-specific language and who approves copy

Communications
- [ ] Approved SMS/email templates and cadence, plus sending identity (number/domain)
- [ ] Opt-out language and compliance reviewer contact

CRM & calendar
- [ ] GoHighLevel account access (or authorization to provision)
- [ ] Pipeline stages and field preferences
- [ ] Booking calendar, availability, meeting length, and confirmation preferences

Data handling
- [ ] Where leads/documents may be stored and any retention requirements
- [ ] Who on Ben's side gets access and at what role

Commercial
- [ ] Signatory name/title and billing contact
- [ ] Preferred payment method and billing email

## Pre-call readiness — verified

Automated checks (`apps/web/e2e/readiness.spec.ts`) confirm, on the production build:

- ✅ `/demo-control` **Restore** returns state to "Not started"; **external
  sending reads DISABLED (safe)** (verified in UI and via `/api/demo-control`).
- ✅ **Pricing** loads with $4,500 / $997 / $7,500 / $1,497 and the closing question.
- ✅ **Approval checklist** loads with 0 / 9 and all nine categories.
- ✅ **Backup screenshots** present (20 images in `../presentation/screenshots`).
- ✅ **No broken links, no console errors** across all 35 routes; **slowest
  screen 125 ms** (Marcus lead detail) — nothing over 3 s.
- ✅ **Three timed rehearsals** of hub → 12 stages → pricing → checklist complete
  cleanly (navigation ~1.3 s each; well under five minutes with live narration).
