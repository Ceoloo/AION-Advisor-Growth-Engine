import type {
  Appointment,
  Application,
  Contact,
  ConsentRecord,
  Lead,
  LeadQualificationSession,
  LeadScore,
  Message,
  Note,
  Organization,
  OrganizationSettings,
  Pipeline,
  PipelineStage,
  Opportunity,
  Policy,
  Profile,
  Membership,
  Task,
} from '@aion/types';
import type { Calendar, SharedTask } from '@aion/scheduling';

/** An activity-timeline entry combining human and automated actions. */
export interface TimelineEvent {
  id: string;
  organizationId: string;
  leadId: string;
  at: string;
  actorType: 'human' | 'automation' | 'ai' | 'system';
  type: string;
  label: string;
}

export interface DemoCampaign {
  id: string;
  organizationId: string;
  name: string;
  channel: string;
  spend: number;
  leadsGenerated: number;
}

/** All records scoped to a single tenant (organization). */
export interface DemoOrg {
  organization: Organization;
  settings: OrganizationSettings;
  profiles: Profile[];
  memberships: Membership[];
  pipelines: Pipeline[];
  stages: PipelineStage[];
  contacts: Contact[];
  leads: Lead[];
  leadScores: LeadScore[];
  qualificationSessions: LeadQualificationSession[];
  opportunities: Opportunity[];
  appointments: Appointment[];
  messages: Message[];
  notes: Note[];
  tasks: Task[];
  applications: Application[];
  policies: Policy[];
  consents: ConsentRecord[];
  campaigns: DemoCampaign[];
  timeline: TimelineEvent[];
  calendars: Calendar[];
  sharedTasks: SharedTask[];
}

export interface DemoWorld {
  orgs: DemoOrg[];
}
