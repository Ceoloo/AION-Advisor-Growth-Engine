/**
 * GoHighLevel domain types and service contracts. The whole platform depends on
 * these interfaces — never on raw GHL API calls. Swap the implementation
 * (live client vs. mock) without touching callers.
 */

export interface GHLContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  tags: string[];
  source?: string;
  customFields?: Record<string, unknown>;
  dateAdded?: string;
}

export interface CreateContactInput {
  locationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export type UpdateContactInput = Partial<Omit<CreateContactInput, 'locationId'>>;

export interface ContactSearchInput {
  locationId: string;
  query?: string;
  email?: string;
  phone?: string;
  limit?: number;
}

export interface GHLOpportunity {
  id: string;
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
}

export interface CreateOpportunityInput {
  locationId: string;
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue?: number;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; position: number }[];
}

export interface GHLAppointment {
  id: string;
  calendarId: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'booked';
}

export interface CreateAppointmentInput {
  locationId: string;
  calendarId: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface GHLMessageInput {
  contactId: string;
  type: 'SMS' | 'Email';
  message: string;
  subject?: string;
}

export interface GHLUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface GHLLocation {
  id: string;
  name: string;
  timezone: string;
}

export interface GHLCustomField {
  id: string;
  name: string;
  fieldKey: string;
  dataType: string;
}

// --- Service interfaces ------------------------------------------------------

export interface GHLContactService {
  createContact(input: CreateContactInput): Promise<GHLContact>;
  updateContact(contactId: string, input: UpdateContactInput): Promise<GHLContact>;
  getContact(contactId: string): Promise<GHLContact>;
  searchContacts(query: ContactSearchInput): Promise<GHLContact[]>;
}

export interface GHLOpportunityService {
  createOpportunity(input: CreateOpportunityInput): Promise<GHLOpportunity>;
  moveStage(opportunityId: string, stageId: string): Promise<GHLOpportunity>;
  getOpportunity(opportunityId: string): Promise<GHLOpportunity>;
}

export interface GHLPipelineService {
  listPipelines(locationId: string): Promise<GHLPipeline[]>;
}

export interface GHLCalendarService {
  createAppointment(input: CreateAppointmentInput): Promise<GHLAppointment>;
  getAppointment(appointmentId: string): Promise<GHLAppointment>;
}

export interface GHLConversationService {
  sendMessage(locationId: string, input: GHLMessageInput): Promise<{ messageId: string }>;
}

export interface GHLWorkflowService {
  addContactToWorkflow(contactId: string, workflowId: string): Promise<{ ok: boolean }>;
}

export interface GHLUserService {
  listUsers(locationId: string): Promise<GHLUser[]>;
}

export interface GHLLocationService {
  getLocation(locationId: string): Promise<GHLLocation>;
}

export interface GHLCustomFieldService {
  listCustomFields(locationId: string): Promise<GHLCustomField[]>;
}

/** Aggregated GHL API surface used by the application. */
export interface GHLServices {
  contacts: GHLContactService;
  opportunities: GHLOpportunityService;
  pipelines: GHLPipelineService;
  calendar: GHLCalendarService;
  conversations: GHLConversationService;
  workflows: GHLWorkflowService;
  users: GHLUserService;
  locations: GHLLocationService;
  customFields: GHLCustomFieldService;
}
