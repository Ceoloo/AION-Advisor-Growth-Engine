/**
 * Canonical enums shared across the platform. Keep these string-literal unions
 * (not TS `enum`s) so they serialize cleanly across the API, database, and AI
 * boundaries and remain tree-shakeable.
 */

// --- Access control ----------------------------------------------------------

export const ROLES = [
  'organization_owner',
  'agency_administrator',
  'financial_advisor',
  'insurance_agent',
  'appointment_setter',
  'sales_manager',
  'compliance_reviewer',
  'client_success_representative',
  'read_only_analyst',
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'org:manage',
  'org:view',
  'members:manage',
  'leads:view',
  'leads:create',
  'leads:update',
  'leads:delete',
  'leads:assign',
  'pipelines:manage',
  'opportunities:manage',
  'appointments:manage',
  'conversations:view',
  'conversations:send',
  'workflows:manage',
  'campaigns:manage',
  'documents:view',
  'documents:request',
  'applications:manage',
  'compliance:review',
  'analytics:view',
  'integrations:manage',
  'settings:manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// --- Organizations -----------------------------------------------------------

export const ORGANIZATION_TYPES = [
  'financial_advisor',
  'wealth_management_firm',
  'life_insurance_agency',
  'health_insurance_brokerage',
  'medicare_agency',
  'employee_benefits',
  'retirement_planning',
  'independent_agency',
  'sales_team',
  'multi_agent_org',
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const INDUSTRY_VERTICALS = ['financial_advisor', 'health_insurance'] as const;
export type IndustryVertical = (typeof INDUSTRY_VERTICALS)[number];

// --- Leads -------------------------------------------------------------------

export const LEAD_STATUSES = [
  'new',
  'working',
  'nurturing',
  'qualified',
  'appointment_set',
  'client',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const QUALIFICATION_STATUSES = [
  'unqualified',
  'nurture',
  'qualified',
  'high_priority',
] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const LEAD_SOURCE_TYPES = [
  'landing_page',
  'web_form',
  'chatbot',
  'advertisement',
  'referral',
  'webinar',
  'outbound_campaign',
  'inbound_call',
  'import',
  'api',
] as const;
export type LeadSourceType = (typeof LEAD_SOURCE_TYPES)[number];

// --- Scoring -----------------------------------------------------------------

export const SCORE_CATEGORIES = [
  'intent',
  'urgency',
  'fit',
  'engagement',
  'completeness',
  'appointment_readiness',
  'financial_potential',
  'product_eligibility',
  'response_activity',
  'referral_quality',
] as const;
export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

export const SCORE_BANDS = [
  'low_priority',
  'nurture',
  'qualified',
  'high_priority',
  'immediate_follow_up',
] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

// --- Appointments ------------------------------------------------------------

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'completed',
  'no_show',
  'cancelled',
  'rescheduled',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// --- Applications & policies -------------------------------------------------

export const APPLICATION_STATUSES = [
  'not_started',
  'started',
  'documents_pending',
  'submitted',
  'carrier_review',
  'approved',
  'declined',
  'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const POLICY_STATUSES = ['active', 'lapsed', 'cancelled', 'pending', 'renewed'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

// --- Conversations -----------------------------------------------------------

export const MESSAGE_CHANNELS = ['sms', 'email', 'call', 'voicemail', 'chat', 'note'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

// --- Workflows & integrations ------------------------------------------------

export const WORKFLOW_RUN_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const INTEGRATION_PROVIDERS = [
  'gohighlevel',
  'twilio',
  'telnyx',
  'sendgrid',
  'mailgun',
  'stripe',
  'square',
  'docusign',
  'pandadoc',
  'google_calendar',
  'outlook_calendar',
  'google_drive',
  'dropbox',
  'clearbit',
  'apollo',
  'zapier',
  'make',
  'n8n',
  'carrier_api',
  'quote_platform',
  'enrichment',
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = [
  'connected',
  'disconnected',
  'error',
  'degraded',
  'not_configured',
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const SYNC_JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'retrying'] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

// --- Compliance --------------------------------------------------------------

export const CONSENT_TYPES = ['sms', 'email', 'call', 'data_processing', 'marketing'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_STATUSES = ['granted', 'revoked', 'pending', 'expired'] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

// --- Funnel / KPIs -----------------------------------------------------------

/**
 * The full revenue funnel Ben cares about, in order:
 * Traffic → Leads → Qualified → Appointments → Showed → Consultations →
 * Opportunities → Clients → Verified Revenue.
 */
export const FUNNEL_STAGES = [
  'traffic',
  'leads',
  'qualified',
  'appointments',
  'showed',
  'consultations',
  'opportunities',
  'clients',
  'verifiedRevenue',
] as const;
export type FunnelStageKey = (typeof FUNNEL_STAGES)[number];

// --- Measurement integrity ---------------------------------------------------

/**
 * The AION measurement framework. Every number the system shows is tagged with
 * its provenance so a modeled projection is never mistaken for a measured fact:
 *
 *   observed  — actually measured (real inputs: lead volume, booking rate, …)
 *   modeled   — illustrative projection from assumptions (NOT a guarantee)
 *   verified  — actual attributed outcomes (real appointments/opportunities/revenue)
 *
 * The arc is Observed → Modeled → Verified: we start from what is measured,
 * model the upside transparently, then replace the model with verified results.
 */
export const MEASUREMENT_TIERS = ['observed', 'modeled', 'verified'] as const;
export type MeasurementTier = (typeof MEASUREMENT_TIERS)[number];

// --- Launch gate (compliance approvals) --------------------------------------

/**
 * The critical pre-launch approvals. EVERY item must be approved before live
 * campaigns are permitted — this is enforced in application logic (see
 * @aion/compliance/launch-gate), not just tracked on a checklist. Missing any
 * critical approval means LIVE CAMPAIGN = BLOCKED.
 */
export const LAUNCH_APPROVAL_ITEMS = [
  { key: 'branding', label: 'Branding approved', detail: 'Logo, colors, practice name, and funnel copy signed off.', critical: true },
  { key: 'biography', label: 'Biography approved', detail: 'Advisor bio, headshot, and credentials finalized.', critical: true },
  { key: 'licensing', label: 'Licensing verified', detail: 'Producer licenses verified for each state and product line in scope.', critical: true },
  { key: 'disclosure', label: 'Disclosure approved', detail: 'Disclosures and suitability language approved by compliance.', critical: true },
  { key: 'messaging', label: 'Messaging approved', detail: 'SMS/email templates and cadences approved; opt-out language confirmed.', critical: true },
  { key: 'data_handling', label: 'Data handling approved', detail: 'Consent capture, retention, and access controls reviewed.', critical: true },
  { key: 'crm', label: 'CRM approved', detail: 'CRM account, pipelines, and field mapping configured and verified.', critical: true },
  { key: 'calendar', label: 'Calendar approved', detail: 'Booking calendar, availability, and confirmation flow tested.', critical: true },
] as const;

export type LaunchApprovalKey = (typeof LAUNCH_APPROVAL_ITEMS)[number]['key'];

/** One approval's recorded state. */
export interface LaunchApprovalRecord {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
}

/** Per-client approval state, keyed by approval item. Missing keys = not approved. */
export type LaunchApprovalState = Partial<Record<LaunchApprovalKey, LaunchApprovalRecord>>;
