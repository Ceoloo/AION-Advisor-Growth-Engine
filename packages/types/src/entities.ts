/**
 * Core domain entity shapes. These mirror the database schema
 * (infrastructure/migrations) and are the canonical TypeScript contracts used
 * by services, the API, and the UI. Every tenant-scoped record carries
 * `organizationId`.
 */
import type {
  AppointmentStatus,
  ApplicationStatus,
  ConsentStatus,
  ConsentType,
  IndustryVertical,
  IntegrationProvider,
  IntegrationStatus,
  LeadSourceType,
  LeadStatus,
  MessageChannel,
  MessageDirection,
  OrganizationType,
  PolicyStatus,
  QualificationStatus,
  Role,
  ScoreBand,
  ScoreCategory,
  WorkflowRunStatus,
} from './enums.js';

/** Fields present on every persisted record. */
export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** Tenant-scoped record. */
export interface TenantRecord extends BaseRecord {
  organizationId: string;
}

/** Provenance metadata attached where records may originate externally. */
export interface SourceMetadata {
  source?: LeadSourceType | string;
  externalId?: string | null;
  externalProvider?: IntegrationProvider | null;
  raw?: Record<string, unknown> | null;
}

// --- Organizations & access --------------------------------------------------

export interface Organization extends BaseRecord {
  name: string;
  slug: string;
  type: OrganizationType;
  primaryVertical: IndustryVertical;
  isDemo: boolean;
}

export interface OrganizationSettings extends TenantRecord {
  timezone: string;
  brandColorPrimary: string;
  scoringWeights: Record<ScoreCategory, number>;
  scoreBandThresholds: Record<ScoreBand, number>;
  featureFlags: Record<string, boolean>;
}

export interface Profile extends BaseRecord {
  authUserId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Membership extends TenantRecord {
  profileId: string;
  role: Role;
  isActive: boolean;
}

// --- Leads & contacts --------------------------------------------------------

export interface Contact extends TenantRecord, SourceMetadata {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  timezone?: string | null;
}

export interface Lead extends TenantRecord, SourceMetadata {
  contactId: string;
  vertical: IndustryVertical;
  status: LeadStatus;
  qualificationStatus: QualificationStatus;
  score: number;
  scoreBand: ScoreBand;
  assignedAdvisorId?: string | null;
  pipelineStageId?: string | null;
  lastActivityAt?: string | null;
}

export interface LeadScore extends TenantRecord {
  leadId: string;
  total: number;
  band: ScoreBand;
  breakdown: Record<ScoreCategory, number>;
  computedByRuleVersion: string;
}

export interface LeadQualificationSession extends TenantRecord {
  leadId: string;
  vertical: IndustryVertical;
  templateId: string;
  completedAt?: string | null;
  answers: Record<string, unknown>;
  result?: QualificationResult | null;
}

export interface QualificationResult {
  qualificationStatus: QualificationStatus;
  intentScore: number;
  urgencyScore: number;
  productInterests: string[];
  needsSummary: string;
  objections: string[];
  missingInformation: string[];
  recommendedNextAction: string;
  appointmentReady: boolean;
}

// --- Sales / CRM -------------------------------------------------------------

export interface Pipeline extends TenantRecord {
  name: string;
  vertical: IndustryVertical;
  isDefault: boolean;
}

export interface PipelineStage extends TenantRecord {
  pipelineId: string;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Opportunity extends TenantRecord {
  leadId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  assignedAdvisorId?: string | null;
}

export interface Appointment extends TenantRecord {
  leadId: string;
  advisorId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  location?: string | null;
  meetingUrl?: string | null;
}

export interface Message extends TenantRecord {
  leadId: string;
  conversationId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  body: string;
  sentAt: string;
  authorType: 'human' | 'automation' | 'ai';
}

export interface Note extends TenantRecord {
  leadId: string;
  authorProfileId?: string | null;
  body: string;
}

export interface Task extends TenantRecord {
  leadId?: string | null;
  assignedProfileId?: string | null;
  title: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

// --- Financial / insurance ---------------------------------------------------

export interface Application extends TenantRecord {
  leadId: string;
  productType: string;
  carrier?: string | null;
  status: ApplicationStatus;
  faceAmount?: number | null;
  submittedAt?: string | null;
}

export interface Policy extends TenantRecord {
  leadId: string;
  applicationId?: string | null;
  policyNumber: string;
  carrier: string;
  productType: string;
  status: PolicyStatus;
  premium: number;
  effectiveDate?: string | null;
  renewalDate?: string | null;
}

export interface Referral extends TenantRecord {
  referringLeadId?: string | null;
  referredContactName: string;
  status: 'new' | 'contacted' | 'converted' | 'declined';
  rewardIssued: boolean;
}

// --- Documents & compliance --------------------------------------------------

export interface DocumentRecord extends TenantRecord {
  leadId?: string | null;
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByProfileId?: string | null;
}

export interface ConsentRecord extends TenantRecord {
  leadId: string;
  type: ConsentType;
  status: ConsentStatus;
  capturedAt: string;
  capturedSource: string;
}

export interface AuditLog extends TenantRecord {
  actorProfileId?: string | null;
  actorType: 'human' | 'automation' | 'ai' | 'system';
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  correlationId?: string | null;
}

// --- Integrations ------------------------------------------------------------

export interface IntegrationConnection extends TenantRecord {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  externalAccountId?: string | null;
  lastSyncedAt?: string | null;
  lastErrorAt?: string | null;
}

export interface WebhookEvent extends TenantRecord {
  provider: IntegrationProvider;
  eventType: string;
  /** Deduplication key — a repeated delivery with the same key is a no-op. */
  idempotencyKey: string;
  payload: Record<string, unknown>;
  processedAt?: string | null;
  status: 'received' | 'processed' | 'duplicate' | 'failed';
}

export interface WorkflowRun extends TenantRecord {
  workflowKey: string;
  status: WorkflowRunStatus;
  leadId?: string | null;
  attempts: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
}

// --- Analytics ---------------------------------------------------------------

export interface FunnelEvent extends TenantRecord {
  leadId?: string | null;
  stage: string;
  occurredAt: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisWeek: number;
  qualifiedLeads: number;
  highPriorityLeads: number;
  appointmentsBooked: number;
  appointmentShowRate: number;
  applicationsStarted: number;
  applicationsSubmitted: number;
  policiesIssued: number;
  closedRevenue: number;
  estimatedPipelineValue: number;
  leadToAppointmentRate: number;
  appointmentToCloseRate: number;
  costPerLead: number;
  costPerAppointment: number;
  costPerAcquisition: number;
  averageResponseTimeMinutes: number;
  renewalOpportunities: number;
  referralActivity: number;
}

/**
 * A point-in-time snapshot of the full revenue funnel over a period. Used for
 * both the computed pilot ("AFTER AION") numbers and the recorded pre-AION
 * baseline ("BEFORE AION"). Counts are absolute; rates are derived elsewhere.
 */
export interface FunnelSnapshot {
  /** Human-readable window, e.g. "Prior 30 days (before AION)". */
  periodLabel: string;
  /** Optional attribution/notes for how the numbers were captured. */
  note?: string;
  traffic: number;
  leads: number;
  qualified: number;
  appointments: number;
  showed: number;
  consultations: number;
  opportunities: number;
  clients: number;
  /** Verified (issued/closed) revenue for the period, in dollars. */
  verifiedRevenue: number;
  /** Marketing spend for the period, in dollars (for CPL/CPQL). */
  spend?: number;
  /** Average first-response time in minutes. */
  responseTimeMinutes?: number;
}
