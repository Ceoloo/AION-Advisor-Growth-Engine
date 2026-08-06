/**
 * In-memory mock implementation of every GHL service. This is what powers demo
 * mode and tests — the application talks to the same interfaces, so swapping to
 * the live client requires no caller changes. Every mocked integration is
 * documented in docs/ghl-integration.md.
 */
import { generateId } from '@aion/shared';
import type {
  ContactSearchInput,
  CreateAppointmentInput,
  CreateContactInput,
  CreateOpportunityInput,
  GHLAppointment,
  GHLCalendarService,
  GHLContact,
  GHLContactService,
  GHLConversationService,
  GHLCustomField,
  GHLCustomFieldService,
  GHLLocation,
  GHLLocationService,
  GHLMessageInput,
  GHLOpportunity,
  GHLOpportunityService,
  GHLPipeline,
  GHLPipelineService,
  GHLServices,
  GHLUser,
  GHLUserService,
  GHLWorkflowService,
  UpdateContactInput,
} from './types.js';

export class MockGHLServices implements GHLServices {
  private readonly contactStore = new Map<string, GHLContact>();
  private readonly opportunityStore = new Map<string, GHLOpportunity>();
  private readonly appointmentStore = new Map<string, GHLAppointment>();

  readonly contacts: GHLContactService = {
    createContact: async (input: CreateContactInput) => {
      const contact: GHLContact = {
        id: generateId('ghlc'),
        locationId: input.locationId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        source: input.source,
        tags: input.tags ?? [],
        customFields: input.customFields,
        dateAdded: new Date().toISOString(),
      };
      this.contactStore.set(contact.id, contact);
      return contact;
    },
    updateContact: async (contactId: string, input: UpdateContactInput) => {
      const existing = this.contactStore.get(contactId);
      if (!existing) throw new Error('contact_not_found');
      const updated: GHLContact = { ...existing, ...input };
      this.contactStore.set(contactId, updated);
      return updated;
    },
    getContact: async (contactId: string) => {
      const c = this.contactStore.get(contactId);
      if (!c) throw new Error('contact_not_found');
      return c;
    },
    searchContacts: async (query: ContactSearchInput) =>
      [...this.contactStore.values()].filter((c) => {
        if (c.locationId !== query.locationId) return false;
        if (query.email && c.email !== query.email) return false;
        if (query.phone && c.phone !== query.phone) return false;
        return true;
      }),
  };

  readonly opportunities: GHLOpportunityService = {
    createOpportunity: async (input: CreateOpportunityInput) => {
      const opp: GHLOpportunity = {
        id: generateId('ghlo'),
        pipelineId: input.pipelineId,
        pipelineStageId: input.pipelineStageId,
        contactId: input.contactId,
        name: input.name,
        monetaryValue: input.monetaryValue ?? 0,
        status: 'open',
      };
      this.opportunityStore.set(opp.id, opp);
      return opp;
    },
    moveStage: async (opportunityId: string, stageId: string) => {
      const opp = this.opportunityStore.get(opportunityId);
      if (!opp) throw new Error('opportunity_not_found');
      const updated: GHLOpportunity = { ...opp, pipelineStageId: stageId };
      this.opportunityStore.set(opportunityId, updated);
      return updated;
    },
    getOpportunity: async (opportunityId: string) => {
      const opp = this.opportunityStore.get(opportunityId);
      if (!opp) throw new Error('opportunity_not_found');
      return opp;
    },
  };

  readonly pipelines: GHLPipelineService = {
    listPipelines: async (_locationId: string): Promise<GHLPipeline[]> => [
      {
        id: 'mock-pipeline-fa',
        name: 'Financial Advisor Pipeline',
        stages: [
          { id: 's1', name: 'New Lead', position: 0 },
          { id: 's2', name: 'Qualified', position: 1 },
          { id: 's3', name: 'Appointment Booked', position: 2 },
        ],
      },
    ],
  };

  readonly calendar: GHLCalendarService = {
    createAppointment: async (input: CreateAppointmentInput) => {
      const appt: GHLAppointment = {
        id: generateId('ghla'),
        calendarId: input.calendarId,
        contactId: input.contactId,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'booked',
      };
      this.appointmentStore.set(appt.id, appt);
      return appt;
    },
    getAppointment: async (appointmentId: string) => {
      const a = this.appointmentStore.get(appointmentId);
      if (!a) throw new Error('appointment_not_found');
      return a;
    },
  };

  readonly conversations: GHLConversationService = {
    sendMessage: async (_locationId: string, _input: GHLMessageInput) => ({
      messageId: generateId('ghlm'),
    }),
  };

  readonly workflows: GHLWorkflowService = {
    addContactToWorkflow: async (_contactId: string, _workflowId: string) => ({ ok: true }),
  };

  readonly users: GHLUserService = {
    listUsers: async (_locationId: string): Promise<GHLUser[]> => [
      { id: 'u1', name: 'Demo Advisor', email: 'advisor@demo.aion', role: 'financial_advisor' },
    ],
  };

  readonly locations: GHLLocationService = {
    getLocation: async (locationId: string): Promise<GHLLocation> => ({
      id: locationId,
      name: 'Demo Location',
      timezone: 'America/New_York',
    }),
  };

  readonly customFields: GHLCustomFieldService = {
    listCustomFields: async (_locationId: string): Promise<GHLCustomField[]> => [
      { id: 'cf1', name: 'Investable Assets', fieldKey: 'investable_assets', dataType: 'TEXT' },
    ],
  };
}
