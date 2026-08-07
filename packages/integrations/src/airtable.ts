/**
 * Server-side Airtable client for the "Revenue & CRM OS" base. NEVER import this
 * into client/browser code — it reads the secret AIRTABLE_ACCESS_TOKEN. All
 * writes go through here from server routes only.
 *
 * Field names are the centralized, editable mapping to the real base schema
 * (Leads, Advisor Scorecard Responses, Intent & Attribution Events). Writes use
 * `typecast: true` so single-select values (event type, growth priority, leak)
 * coerce without needing the exact option ids.
 */
import { loadEnv, logger as rootLogger, generateId, type Logger } from '@aion/shared';

/** Centralized field-name mapping (edit here if the base schema changes). */
export const AIRTABLE_FIELDS = {
  leads: {
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    role: 'Role',
    formSourceUrl: 'Form Source URL',
    summary: 'AION Summary',
    campaignLink: '📣 Marketing Campaigns',
  },
  responses: {
    responseId: 'Response ID',
    responseName: 'Response Name',
    lead: 'Lead',
    campaign: 'Campaign',
    leadMagnet: 'Lead Magnet',
    submittedAt: 'Submitted At',
    fullName: 'Full Name',
    company: 'Company / Practice',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    monthlyLeadVolume: 'Monthly Lead Volume',
    primaryLeadSources: 'Primary Lead Sources',
    currentCrm: 'Current CRM',
    acquisitionScore: 'Acquisition Score',
    speedScore: 'Speed-to-Lead Score',
    qualificationScore: 'Qualification Score',
    followUpScore: 'Follow-Up & Nurture Score',
    bookingScore: 'Booking & Show Score',
    crmScore: 'CRM & Attribution Score',
    primaryLeak: 'Primary Leak',
    topFindings: 'Top 3 Findings',
    firstFix: 'Recommended First Fix',
    resultSummary: 'Personalized Result Summary',
    growthPriority: 'Growth Priority',
    interestedInReview: 'Interested in Review',
    consent: 'Consent to Follow Up',
    sourceUtm: 'Source / UTM',
    rawAnswers: 'Raw Answers / Notes',
  },
  events: {
    eventId: 'Event ID',
    eventName: 'Event Name',
    lead: 'Lead',
    campaign: 'Campaign',
    leadMagnet: 'Lead Magnet / Audit',
    eventType: 'Event Type',
    eventDate: 'Event Date',
    channel: 'Channel',
    intentPoints: 'Intent Points',
    sourceUtm: 'Source / UTM',
    content: 'Content / Message',
    evidence: 'Evidence / Notes',
    verified: 'Verified',
  },
} as const;

type Fields = Record<string, unknown>;
interface AirtableRecord {
  id: string;
  fields: Fields;
}

export interface AirtableConfig {
  token: string;
  apiBaseUrl: string;
  baseId: string;
  leadsTableId: string;
  responsesTableId: string;
  eventsTableId: string;
  campaignRecordId: string;
  assetRecordId: string;
}

/** Non-secret defaults for the AION "Revenue & CRM OS" base (server-side only). */
export const AIRTABLE_DEFAULTS = {
  apiBaseUrl: 'https://api.airtable.com/v0',
  baseId: 'appezuvIZLMwAFnFB',
  leadsTableId: 'tblHxq81EcZtduR5T',
  responsesTableId: 'tbl73qC0rKOwZwMCu',
  eventsTableId: 'tblvhrV2lgbrZ3Ch8',
  campaignRecordId: 'recfZeWhsImzp0Cxc',
  assetRecordId: 'recZqIoAntR6njY4N',
} as const;

export function airtableConfigFromEnv(): AirtableConfig | null {
  const env = loadEnv();
  if (!env.AIRTABLE_ACCESS_TOKEN) return null; // not configured → caller no-ops
  return {
    token: env.AIRTABLE_ACCESS_TOKEN,
    apiBaseUrl: env.AIRTABLE_API_BASE_URL ?? AIRTABLE_DEFAULTS.apiBaseUrl,
    baseId: env.AIRTABLE_BASE_ID ?? AIRTABLE_DEFAULTS.baseId,
    leadsTableId: env.AIRTABLE_LEADS_TABLE_ID ?? AIRTABLE_DEFAULTS.leadsTableId,
    responsesTableId: env.AIRTABLE_SCORECARD_RESPONSES_TABLE_ID ?? AIRTABLE_DEFAULTS.responsesTableId,
    eventsTableId: env.AIRTABLE_INTENT_EVENTS_TABLE_ID ?? AIRTABLE_DEFAULTS.eventsTableId,
    campaignRecordId: env.AION_FINANCIAL_ADVISOR_CAMPAIGN_RECORD_ID ?? AIRTABLE_DEFAULTS.campaignRecordId,
    assetRecordId: env.AION_ADVISOR_SCORECARD_ASSET_RECORD_ID ?? AIRTABLE_DEFAULTS.assetRecordId,
  };
}

export interface LeadInput {
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  role?: string;
  formSourceUrl?: string;
  summary?: string;
}

export interface ResponseInput {
  responseId: string;
  fullName: string;
  company: string;
  email: string;
  phone?: string;
  role?: string;
  monthlyLeadVolume?: number;
  primaryLeadSources?: string;
  currentCrm?: string;
  sectionScores: {
    acquisition: number;
    speed_to_lead: number;
    qualification: number;
    follow_up: number;
    booking: number;
    crm: number;
  };
  primaryLeak: string;
  topFindings: string;
  firstFix: string;
  resultSummary: string;
  growthPriority?: string;
  interestedInReview?: boolean;
  consent: boolean;
  sourceUtm?: string;
  rawAnswers?: string;
}

export interface EventInput {
  eventId: string;
  eventType: string;
  intentPoints: number;
  channel?: string;
  sourceUtm?: string;
  content?: string;
  evidence?: string;
  verified?: boolean;
}

const nonEmpty = (fields: Fields): Fields =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== '' && v !== null));

export class AirtableClient {
  private readonly log: Logger;
  constructor(
    private readonly config: AirtableConfig,
    logger?: Logger,
  ) {
    this.log = logger ?? rootLogger.child({ component: 'airtable' });
  }

  private url(tableId: string, suffix = ''): string {
    return `${this.config.apiBaseUrl}/${this.config.baseId}/${tableId}${suffix}`;
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${this.config.token}`,
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Airtable ${method} ${res.status}: ${detail.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }

  private async findOne(tableId: string, formula: string): Promise<AirtableRecord | null> {
    const url = this.url(tableId, `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
    const data = await this.request<{ records: AirtableRecord[] }>('GET', url);
    return data.records[0] ?? null;
  }

  private async create(tableId: string, fields: Fields): Promise<AirtableRecord> {
    return this.request<AirtableRecord>('POST', this.url(tableId), {
      fields: nonEmpty(fields),
      typecast: true,
    });
  }

  private async patch(tableId: string, recordId: string, fields: Fields): Promise<AirtableRecord> {
    return this.request<AirtableRecord>('PATCH', this.url(tableId, `/${recordId}`), {
      fields: nonEmpty(fields),
      typecast: true,
    });
  }

  /**
   * Upsert a Lead by email. Existing CRM data is PRESERVED: on an existing lead
   * only currently-empty fields are filled, and the campaign link is ensured.
   */
  async upsertLead(input: LeadInput): Promise<{ id: string; created: boolean }> {
    const F = AIRTABLE_FIELDS.leads;
    const emailEsc = input.email.replace(/'/g, '');
    const existing = await this.findOne(
      this.config.leadsTableId,
      `LOWER({${F.email}})=LOWER('${emailEsc}')`,
    );

    if (existing) {
      const cur = existing.fields;
      const fill: Fields = {};
      const setIfEmpty = (field: string, value: unknown) => {
        if (value != null && value !== '' && (cur[field] == null || cur[field] === '')) fill[field] = value;
      };
      setIfEmpty(F.fullName, input.fullName);
      setIfEmpty(F.phone, input.phone);
      setIfEmpty(F.company, input.company);
      setIfEmpty(F.role, input.role);
      setIfEmpty(F.formSourceUrl, input.formSourceUrl);
      // Ensure the campaign link is present (merge, don't drop existing links).
      const links = (cur[F.campaignLink] as { id: string }[] | undefined) ?? [];
      const linkIds = links.map((l) => l.id);
      if (!linkIds.includes(this.config.campaignRecordId)) {
        fill[F.campaignLink] = [...linkIds, this.config.campaignRecordId];
      }
      if (Object.keys(fill).length > 0) await this.patch(this.config.leadsTableId, existing.id, fill);
      return { id: existing.id, created: false };
    }

    const rec = await this.create(this.config.leadsTableId, {
      [F.fullName]: input.fullName,
      [F.email]: input.email,
      [F.phone]: input.phone,
      [F.company]: input.company,
      [F.role]: input.role,
      [F.formSourceUrl]: input.formSourceUrl,
      [F.summary]: input.summary,
      [F.campaignLink]: [this.config.campaignRecordId],
    });
    return { id: rec.id, created: true };
  }

  /** Create a scorecard response, idempotent by Response ID. */
  async createScorecardResponse(
    input: ResponseInput,
    leadId?: string,
  ): Promise<{ id: string; deduped: boolean }> {
    const F = AIRTABLE_FIELDS.responses;
    const existing = await this.findOne(
      this.config.responsesTableId,
      `{${F.responseId}}='${input.responseId.replace(/'/g, '')}'`,
    );
    if (existing) return { id: existing.id, deduped: true };

    const rec = await this.create(this.config.responsesTableId, {
      [F.responseId]: input.responseId,
      [F.responseName]: `${input.fullName} — ${input.company}`,
      [F.lead]: leadId ? [leadId] : undefined,
      [F.campaign]: [this.config.campaignRecordId],
      [F.leadMagnet]: [this.config.assetRecordId],
      [F.submittedAt]: new Date().toISOString(),
      [F.fullName]: input.fullName,
      [F.company]: input.company,
      [F.email]: input.email,
      [F.phone]: input.phone,
      [F.role]: input.role,
      [F.monthlyLeadVolume]: input.monthlyLeadVolume,
      [F.primaryLeadSources]: input.primaryLeadSources,
      [F.currentCrm]: input.currentCrm,
      [F.acquisitionScore]: input.sectionScores.acquisition,
      [F.speedScore]: input.sectionScores.speed_to_lead,
      [F.qualificationScore]: input.sectionScores.qualification,
      [F.followUpScore]: input.sectionScores.follow_up,
      [F.bookingScore]: input.sectionScores.booking,
      [F.crmScore]: input.sectionScores.crm,
      [F.primaryLeak]: input.primaryLeak,
      [F.topFindings]: input.topFindings,
      [F.firstFix]: input.firstFix,
      [F.resultSummary]: input.resultSummary,
      [F.growthPriority]: input.growthPriority,
      [F.interestedInReview]: input.interestedInReview ?? false,
      [F.consent]: input.consent,
      [F.sourceUtm]: input.sourceUtm,
      [F.rawAnswers]: input.rawAnswers,
    });
    return { id: rec.id, deduped: false };
  }

  /** Create an intent event, idempotent by Event ID. */
  async createIntentEvent(
    input: EventInput,
    leadId?: string,
  ): Promise<{ id: string; deduped: boolean }> {
    const F = AIRTABLE_FIELDS.events;
    const existing = await this.findOne(
      this.config.eventsTableId,
      `{${F.eventId}}='${input.eventId.replace(/'/g, '')}'`,
    );
    if (existing) return { id: existing.id, deduped: true };

    const rec = await this.create(this.config.eventsTableId, {
      [F.eventId]: input.eventId,
      [F.eventName]: `${input.eventType} — ${new Date().toISOString().slice(0, 10)}`,
      [F.lead]: leadId ? [leadId] : undefined,
      [F.campaign]: [this.config.campaignRecordId],
      [F.leadMagnet]: [this.config.assetRecordId],
      [F.eventType]: input.eventType,
      [F.eventDate]: new Date().toISOString(),
      [F.channel]: input.channel,
      [F.intentPoints]: input.intentPoints,
      [F.sourceUtm]: input.sourceUtm,
      [F.content]: input.content,
      [F.evidence]: input.evidence,
      [F.verified]: input.verified ?? true,
    });
    return { id: rec.id, deduped: false };
  }
}

/** Build a client from env, or return null when Airtable is not configured. */
export function createAirtableClient(logger?: Logger): AirtableClient | null {
  const config = airtableConfigFromEnv();
  if (!config) return null;
  return new AirtableClient(config, logger);
}

export { generateId as newAirtableEventId };
