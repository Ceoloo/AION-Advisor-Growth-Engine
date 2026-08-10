import type { ClientConfig } from '../types.js';

/**
 * Client #2 — Maria Santos. A second advisor in a DIFFERENT vertical (Medicare /
 * health insurance), mid-onboarding. She exists to prove the point of the whole
 * configuration layer: a new advisor is a new ClientConfig on the SAME engine —
 * no product fork. Her approval status is still pending, so the engine treats
 * her as not-yet-live while Ben runs.
 */
export const mariaSantos: ClientConfig = {
  clientId: 'maria-santos',
  organizationId: 'org_maria-santos',
  slug: 'maria-santos',
  displayName: 'Maria Santos — Medicare & Retirement Health',
  vertical: 'health_insurance',

  advisor: {
    name: 'Maria Santos',
    title: 'Licensed Medicare & Health Insurance Advisor',
    bio: 'Maria guides retirees and near-retirees through Medicare, supplemental coverage, and retirement health planning with patient, jargon-free explanations.',
    headshot: '/clients/maria-santos/headshot.jpg',
    licensedStates: ['TX', 'AZ', 'NM'],
    serviceArea: 'Greater Austin + remote across TX/AZ/NM',
  },
  brand: {
    primaryColor: '#12433B',
    accentColor: '#E4A11B',
    logo: '/clients/maria-santos/logo.svg',
  },

  primaryAudience: 'Retirees and near-retirees navigating Medicare and health coverage',
  planningAreas: [
    'Medicare enrollment',
    'Supplemental & Advantage plans',
    'Prescription coverage',
    'Retirement health budgeting',
  ],

  bookingUrl: 'https://cal.com/maria-santos/medicare-review',
  providers: {
    crm: 'gohighlevel',
    calendar: 'native',
  },

  leadSources: ['Community workshop', 'Referral', 'Landing page', 'Local radio'],
  followupCadence: [
    { afterHours: 0, channel: 'email', label: 'Welcome email + plan checklist' },
    { afterHours: 4, channel: 'call', label: 'Same-day advisor call' },
    { afterHours: 48, channel: 'sms', label: 'Day-2 reminder (consented)' },
  ],

  team: [
    { name: 'Maria Santos', role: 'agency_administrator', receivesLeads: true },
    { name: 'Luis Ramirez', role: 'insurance_agent', receivesLeads: true },
    { name: 'Priya Nair', role: 'appointment_setter' },
  ],

  compliance: {
    status: 'in_review',
    notes: 'CMS-sensitive Medicare marketing copy under compliance review.',
  },
  approval: {
    status: 'pending_approval',
  },

  baseline: {
    periodLabel: 'Prior 30 days (before AION)',
    note: 'Workshop sign-ups worked manually; no same-day follow-up.',
    traffic: 70,
    leads: 6,
    qualified: 2,
    appointments: 1,
    showed: 1,
    consultations: 0,
    opportunities: 0,
    clients: 0,
    verifiedRevenue: 0,
    spend: 8100,
    responseTimeMinutes: 180,
  },
  pilotPeriodLabel: 'Pilot to date (with AION)',

  isDemo: true,
  demoLeadVolume: 8,
  seedOffset: 7,
};
