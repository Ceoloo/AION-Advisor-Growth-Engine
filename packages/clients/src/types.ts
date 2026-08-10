/**
 * ClientConfig — the real client configuration layer.
 *
 * Instead of hardcoding a single advisor (Ben) into the product, every advisor
 * client is expressed as a declarative `ClientConfig`. The engine reads the
 * active config to brand itself, seed its org, route leads, wire providers, and
 * gate go-live. Onboarding a new advisor is adding a config — not a code fork.
 *
 *     Ben          →  ClientConfig  ┐
 *     Advisor #2   →  ClientConfig  ├─→  the SAME AION engine
 *     Advisor #3   →  ClientConfig  ┘
 */
import type { IndustryVertical, Role } from '@aion/types';

/** Where the client is in the AION build/approval lifecycle. */
export const CLIENT_APPROVAL_STATUSES = [
  'draft', // config being authored
  'pending_approval', // awaiting client sign-off
  'approved', // signed off, not yet serving traffic
  'active', // live / serving
  'suspended', // temporarily paused
] as const;
export type ClientApprovalStatus = (typeof CLIENT_APPROVAL_STATUSES)[number];

/** Compliance review state for the client's branding, copy, and disclosures. */
export const CLIENT_COMPLIANCE_STATUSES = [
  'not_started',
  'in_review',
  'changes_requested',
  'approved',
] as const;
export type ClientComplianceStatus = (typeof CLIENT_COMPLIANCE_STATUSES)[number];

/** CRM systems the engine can sit on top of. */
export const CRM_PROVIDERS = ['gohighlevel', 'airtable', 'none'] as const;
export type CrmProvider = (typeof CRM_PROVIDERS)[number];

/** Calendar/scheduling backends. */
export const CALENDAR_PROVIDERS = ['native', 'gohighlevel', 'calendly', 'external'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

/** A single member of the client's practice. */
export interface TeamMember {
  name: string;
  role: Role;
  /** When true this member is in the lead round-robin / assignment pool. */
  receivesLeads?: boolean;
}

/** One step in the client's follow-up cadence (deterministic, no auto-send). */
export interface FollowupStep {
  /** Hours after the trigger event this step fires. */
  afterHours: number;
  channel: 'sms' | 'email' | 'call' | 'task';
  label: string;
}

/** Advisor identity + credentials — the human the client experience is about. */
export interface AdvisorProfile {
  name: string;
  title: string;
  bio: string;
  /** Path or URL to the advisor headshot (asset reference, not binary). */
  headshot?: string;
  /** US state codes the advisor is licensed in. */
  licensedStates: string[];
  /** Human-readable service area, e.g. "South Florida + remote nationwide". */
  serviceArea: string;
}

/** Brand assets applied to the client-facing experience. */
export interface BrandAssets {
  primaryColor?: string;
  accentColor?: string;
  logo?: string;
  /** Additional named asset references (favicon, og-image, etc.). */
  extra?: Record<string, string>;
}

/**
 * The complete configuration for one advisor client. Field names mirror the
 * product spec so a config reads like an onboarding form.
 */
export interface ClientConfig {
  /** Stable slug identifier for the client (e.g. "ben-peretz"). */
  clientId: string;
  /** The tenant/organization id in the data layer (e.g. "org_ben-peretz"). */
  organizationId: string;
  /** Slug used for org, booking calendars, and public links. */
  slug: string;
  /** Full practice display name, e.g. "Ben Peretz — Financial Protection & Planning". */
  displayName: string;
  vertical: IndustryVertical;

  advisor: AdvisorProfile;
  brand: BrandAssets;

  /** Who the practice primarily serves. */
  primaryAudience: string;
  /** Planning areas the advisor covers (drives copy + qualification framing). */
  planningAreas: string[];

  /** Provider-agnostic booking URL for the primary review/consult. */
  bookingUrl?: string;
  providers: {
    crm: CrmProvider;
    calendar: CalendarProvider;
  };

  /** Where leads come from (drives attribution + reporting). */
  leadSources: string[];
  /** Deterministic follow-up cadence (a human still approves outbound). */
  followupCadence: FollowupStep[];

  /** The practice roster. The first lead-receiving member is the default owner. */
  team: TeamMember[];

  compliance: {
    status: ClientComplianceStatus;
    reviewedBy?: string;
    notes?: string;
  };
  approval: {
    status: ClientApprovalStatus;
    approvedBy?: string;
    approvedAt?: string;
  };

  /** True for a seeded demo tenant (safe, synthetic data). */
  isDemo: boolean;
  /** Number of demo leads to generate for this tenant. */
  demoLeadVolume: number;
  /** Deterministic seed offset so each tenant produces a distinct world. */
  seedOffset: number;
  /** Scripted demo journey to inject, if any (e.g. the Marcus Johnson pilot). */
  demoJourney?: 'marcus-johnson';
}
