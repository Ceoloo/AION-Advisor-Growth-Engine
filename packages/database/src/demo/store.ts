/**
 * In-memory, tenant-scoped demo store. Mirrors how the live repository layer
 * behaves: every read is scoped by organizationId and a lookup for a record in
 * the wrong tenant returns nothing. This is what the web app and API read from
 * in demo mode, and what the tenant-isolation tests exercise.
 */
import { generateDemoWorld } from './seed.js';
import type { DemoOrg, DemoWorld } from './types.js';

export class DemoStore {
  private readonly world: DemoWorld;
  private readonly byId: Map<string, DemoOrg>;

  constructor(seed = 42) {
    this.world = generateDemoWorld(seed);
    this.byId = new Map(this.world.orgs.map((o) => [o.organization.id, o]));
  }

  listOrganizations() {
    return this.world.orgs.map((o) => o.organization);
  }

  /** Return the full scoped record set for a tenant, or null if unknown. */
  org(organizationId: string): DemoOrg | null {
    return this.byId.get(organizationId) ?? null;
  }

  /** Look up a lead, enforcing tenant scope: foreign lookups return null. */
  getLead(organizationId: string, leadId: string) {
    const org = this.org(organizationId);
    if (!org) return null;
    return org.leads.find((l) => l.id === leadId) ?? null;
  }

  getContact(organizationId: string, contactId: string) {
    return this.org(organizationId)?.contacts.find((c) => c.id === contactId) ?? null;
  }

  /** Everything needed to render a lead detail page, tenant-scoped. */
  getLeadDetail(organizationId: string, leadId: string) {
    const org = this.org(organizationId);
    const lead = org?.leads.find((l) => l.id === leadId);
    if (!org || !lead) return null;
    return {
      lead,
      contact: org.contacts.find((c) => c.id === lead.contactId) ?? null,
      score: org.leadScores.find((s) => s.leadId === leadId) ?? null,
      qualification: org.qualificationSessions.find((q) => q.leadId === leadId) ?? null,
      messages: org.messages.filter((m) => m.leadId === leadId),
      notes: org.notes.filter((n) => n.leadId === leadId),
      tasks: org.tasks.filter((t) => t.leadId === leadId),
      appointments: org.appointments.filter((a) => a.leadId === leadId),
      applications: org.applications.filter((a) => a.leadId === leadId),
      consents: org.consents.filter((c) => c.leadId === leadId),
      timeline: org.timeline
        .filter((e) => e.leadId === leadId)
        .sort((a, b) => (a.at < b.at ? 1 : -1)),
      advisor: org.profiles.find((p) => p.id === lead.assignedAdvisorId) ?? null,
    };
  }

  /** Calendars for a tenant. */
  listCalendars(organizationId: string) {
    return this.org(organizationId)?.calendars ?? [];
  }

  /** Resolve a public booking-link slug to its calendar + owning org. */
  findCalendarBySlug(slug: string) {
    for (const org of this.world.orgs) {
      const calendar = org.calendars.find((c) => c.slug === slug && c.isActive);
      if (calendar) return { calendar, org };
    }
    return null;
  }
}

let singleton: DemoStore | null = null;
export function getDemoStore(): DemoStore {
  if (!singleton) singleton = new DemoStore();
  return singleton;
}
