import type { ClientConfig } from '../types.js';

/**
 * Client #1 — Ben Peretz. The pilot advisor. Everything that used to be
 * hardcoded about Ben now lives here as data. This is the reference config new
 * advisors are cloned from.
 */
export const benPeretz: ClientConfig = {
  clientId: 'ben-peretz',
  organizationId: 'org_ben-peretz',
  slug: 'ben-peretz',
  displayName: 'Ben Peretz — Financial Protection & Planning',
  vertical: 'financial_advisor',

  advisor: {
    name: 'Ben Peretz',
    title: 'Financial Protection & Planning Advisor',
    bio: 'Ben helps families and business owners put the right protection and planning in place — life insurance, income protection, and estate basics — with a clear, no-pressure process.',
    headshot: '/clients/ben-peretz/headshot.jpg',
    licensedStates: ['FL', 'NY', 'NJ'],
    serviceArea: 'South Florida + remote nationwide',
  },
  brand: {
    primaryColor: '#0B2A4A',
    accentColor: '#C9A227',
    logo: '/clients/ben-peretz/logo.svg',
  },

  primaryAudience: 'Families and small-business owners planning for financial protection',
  planningAreas: [
    'Life & income protection',
    'Retirement & savings',
    'Estate planning basics',
    'Business continuity',
  ],

  bookingUrl: 'https://cal.com/ben-peretz/advisor-growth-review',
  providers: {
    crm: 'gohighlevel',
    calendar: 'native',
  },

  leadSources: ['Landing page', 'Referral', 'Webinar', 'Paid social', 'QR code'],
  followupCadence: [
    { afterHours: 0, channel: 'sms', label: 'Instant welcome text (consented)' },
    { afterHours: 1, channel: 'call', label: 'Advisor call within the hour' },
    { afterHours: 24, channel: 'email', label: 'Day-1 recap + booking link' },
    { afterHours: 72, channel: 'task', label: 'Day-3 advisor check-in task' },
  ],

  team: [
    { name: 'Ben Peretz', role: 'agency_administrator', receivesLeads: true },
    { name: 'Dana Cohen', role: 'appointment_setter' },
    { name: 'Rachel Adler', role: 'client_success_representative' },
  ],

  compliance: {
    status: 'approved',
    reviewedBy: 'Ben Peretz',
    notes: 'Pilot copy and disclosures reviewed for the financial-protection funnel.',
  },
  approval: {
    status: 'active',
    approvedBy: 'Ben Peretz',
    approvedAt: '2026-01-15T00:00:00.000Z',
  },
  // Every critical approval complete → LAUNCH ELIGIBLE.
  launchApprovals: {
    branding: { approved: true, approvedBy: 'Ben Peretz', approvedAt: '2026-01-10T00:00:00.000Z' },
    biography: { approved: true, approvedBy: 'Ben Peretz', approvedAt: '2026-01-10T00:00:00.000Z' },
    licensing: { approved: true, approvedBy: 'Compliance', approvedAt: '2026-01-12T00:00:00.000Z' },
    disclosure: { approved: true, approvedBy: 'Compliance', approvedAt: '2026-01-12T00:00:00.000Z' },
    messaging: { approved: true, approvedBy: 'Ben Peretz', approvedAt: '2026-01-13T00:00:00.000Z' },
    data_handling: { approved: true, approvedBy: 'Compliance', approvedAt: '2026-01-13T00:00:00.000Z' },
    crm: { approved: true, approvedBy: 'Ben Peretz', approvedAt: '2026-01-14T00:00:00.000Z' },
    calendar: { approved: true, approvedBy: 'Ben Peretz', approvedAt: '2026-01-14T00:00:00.000Z' },
  },

  // BEFORE AION — Ben's prior 30 days, captured at pilot kickoff. The dashboard
  // compares this against the live pilot funnel to show the lift.
  baseline: {
    periodLabel: 'Prior 30 days (before AION)',
    note: 'Manual intake, spreadsheet follow-up, ~4-hour first response.',
    traffic: 300,
    leads: 24,
    qualified: 9,
    appointments: 4,
    showed: 2,
    consultations: 1,
    opportunities: 1,
    clients: 0,
    verifiedRevenue: 0,
    spend: 8100,
    responseTimeMinutes: 240,
  },
  pilotPeriodLabel: 'Pilot to date (with AION)',

  isDemo: true,
  demoLeadVolume: 32,
  seedOffset: 0,
  demoJourney: 'marcus-johnson',
};
