/**
 * Deterministic demo-data generator. Given a numeric seed it always produces
 * the same world, so demos and tests are reproducible. Data is realistic enough
 * to present to a financial-services professional but contains no real PII.
 *
 * Meets the brief's demo minimums (section 16): 30+ leads, 2 pipeline
 * templates, 10 appointments, 6 applications, 4 active policies, 5 campaigns,
 * 3 advisor accounts, 50+ timeline events, plus a second tenant for isolation.
 */
import {
  DEFAULT_BAND_THRESHOLDS,
  DEFAULT_WEIGHTS,
  computeScore,
  extractSignals,
  templateForVertical,
} from '@aion/ai';
import type {
  Appointment,
  Application,
  Contact,
  ConsentRecord,
  IndustryVertical,
  Lead,
  LeadQualificationSession,
  LeadScore,
  Membership,
  Message,
  Note,
  Opportunity,
  Organization,
  OrganizationSettings,
  Pipeline,
  PipelineStage,
  Policy,
  Profile,
  QualificationResult,
  Role,
  ScoreCategory,
  Task,
} from '@aion/types';
import { seededRandom } from '@aion/shared';
import type { Calendar, SharedTask, WeeklyAvailability } from '@aion/scheduling';
import { CLIENT_CONFIGS, leadPool, type ClientConfig } from '@aion/clients';
import { PIPELINE_TEMPLATES } from '../pipelines.js';
import type { DemoCampaign, DemoOrg, DemoWorld, TimelineEvent } from './types.js';

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
];
const STATES = ['FL', 'TX', 'CA', 'NY', 'GA', 'NC', 'OH', 'AZ', 'PA', 'IL'];
const SOURCES = ['landing_page', 'web_form', 'referral', 'webinar', 'advertisement', 'chatbot'] as const;

function iso(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function makeSettings(organizationId: string): OrganizationSettings {
  return {
    id: `${organizationId}-settings`,
    organizationId,
    createdAt: iso(120),
    updatedAt: iso(1),
    timezone: 'America/New_York',
    brandColorPrimary: '#2563eb',
    scoringWeights: DEFAULT_WEIGHTS,
    scoreBandThresholds: DEFAULT_BAND_THRESHOLDS,
    featureFlags: { aiQualification: true, demoBanner: true },
  };
}

function deriveQualificationResult(
  vertical: IndustryVertical,
  signals: Partial<Record<ScoreCategory, number>>,
  score: number,
): QualificationResult {
  const status =
    score >= 75 ? 'high_priority' : score >= 55 ? 'qualified' : score >= 30 ? 'nurture' : 'unqualified';
  const interests =
    vertical === 'financial_advisor'
      ? ['Retirement planning', 'Life insurance']
      : ['Medicare Advantage', 'Prescription drug plans'];
  return {
    qualificationStatus: status,
    intentScore: Math.round(signals.intent ?? 50),
    urgencyScore: Math.round(signals.urgency ?? 50),
    productInterests: interests,
    needsSummary:
      vertical === 'financial_advisor'
        ? 'Prospect wants to protect retirement income and reduce tax exposure. Advisor review required.'
        : 'Prospect needs coverage before their current plan ends. Eligibility looks favorable.',
    objections: score < 55 ? ['Wants to compare options'] : [],
    missingInformation: score < 55 ? ['Budget', 'Timeline'] : [],
    recommendedNextAction: status === 'high_priority' ? 'Call within the hour' : 'Send booking link',
    appointmentReady: score >= 55,
  };
}

/**
 * Build a demo tenant entirely from a ClientConfig. Nothing about the advisor
 * is hardcoded here anymore — identity, team, vertical, routing, lead volume,
 * and the scripted journey all come from the config. Onboarding a new advisor
 * is adding a config, not editing this function.
 */
function buildOrg(config: ClientConfig, baseSeed: number): DemoOrg {
  const rng = seededRandom(baseSeed + config.seedOffset);
  const organizationId = config.organizationId;
  const leadCount = config.demoLeadVolume;

  const organization: Organization = {
    id: organizationId,
    createdAt: iso(120),
    updatedAt: iso(1),
    name: config.displayName,
    slug: config.slug,
    type: config.vertical === 'health_insurance' ? 'health_insurance_brokerage' : 'financial_advisor',
    primaryVertical: config.vertical,
    isDemo: config.isDemo,
  };

  // --- Advisor profiles + memberships (from config.team) ---------------------
  const advisorSpecs: { name: string; role: Role }[] = config.team.map((m) => ({
    name: m.name,
    role: m.role,
  }));
  const profiles: Profile[] = advisorSpecs.map((a, i) => ({
    id: `${organizationId}_p${i}`,
    authUserId: `auth_${config.slug}_${i}`,
    fullName: a.name,
    email: `${a.name.split(' ')[0]!.toLowerCase()}@${config.slug}.demo`,
    createdAt: iso(120),
    updatedAt: iso(1),
  }));
  const memberships: Membership[] = profiles.map((p, i) => ({
    id: `${organizationId}_m${i}`,
    organizationId,
    profileId: p.id,
    role: advisorSpecs[i]!.role,
    isActive: true,
    createdAt: iso(120),
    updatedAt: iso(1),
  }));
  // Lead routing comes from the config's lead pool (receivesLeads members).
  const poolNames = new Set(leadPool(config).map((m) => m.name));
  const advisorIds = profiles.filter((p) => poolNames.has(p.fullName)).map((p) => p.id);

  // --- Pipelines + stages (both templates) -----------------------------------
  const pipelines: Pipeline[] = [];
  const stages: PipelineStage[] = [];
  for (const tpl of PIPELINE_TEMPLATES) {
    const pipelineId = `${organizationId}_pl_${tpl.vertical}`;
    pipelines.push({
      id: pipelineId,
      organizationId,
      name: tpl.name,
      vertical: tpl.vertical,
      isDefault: tpl.vertical === config.vertical,
      createdAt: iso(120),
      updatedAt: iso(1),
    });
    tpl.stages.forEach((s, idx) => {
      stages.push({
        id: `${pipelineId}_s${idx}`,
        organizationId,
        pipelineId,
        name: s.name,
        position: idx,
        isWon: !!s.isWon,
        isLost: !!s.isLost,
        createdAt: iso(120),
        updatedAt: iso(1),
      });
    });
  }

  // --- Leads / contacts / scores / qualification -----------------------------
  const contacts: Contact[] = [];
  const leads: Lead[] = [];
  const leadScores: LeadScore[] = [];
  const qualificationSessions: LeadQualificationSession[] = [];
  const opportunities: Opportunity[] = [];
  const appointments: Appointment[] = [];
  const messages: Message[] = [];
  const notes: Note[] = [];
  const tasks: Task[] = [];
  const applications: Application[] = [];
  const policies: Policy[] = [];
  const consents: ConsentRecord[] = [];
  const timeline: TimelineEvent[] = [];

  for (let i = 0; i < leadCount; i++) {
    const vertical: IndustryVertical =
      config.vertical === 'health_insurance'
        ? rng() < 0.7
          ? 'health_insurance'
          : 'financial_advisor'
        : rng() < 0.7
          ? 'financial_advisor'
          : 'health_insurance';

    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const daysAgo = Math.floor(rng() * 45);
    const contactId = `${organizationId}_c${i}`;
    const leadId = `${organizationId}_l${i}`;
    const source = pick(rng, SOURCES);

    contacts.push({
      id: contactId,
      organizationId,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `555${String(1000000 + Math.floor(rng() * 8999999))}`,
      state: pick(rng, STATES),
      timezone: 'America/New_York',
      source,
      createdAt: iso(daysAgo),
      updatedAt: iso(Math.max(0, daysAgo - 1)),
    });

    // Deterministic qualification answers → signals → score.
    const template = templateForVertical(vertical);
    const answers: Record<string, unknown> = {
      appointment_urgency: pick(rng, ['ASAP', 'This week', 'This month', 'Just researching']),
      age_range: pick(rng, ['30-39', '40-49', '50-59', '60-64', '65+']),
    };
    if (vertical === 'financial_advisor') {
      answers.investable_assets = pick(rng, ['<$50k', '$50k-$249k', '$250k-$999k', '$1M-$4.9M']);
      answers.estate_planning_needs = rng() < 0.5;
      answers.existing_advisor = rng() < 0.4;
    } else {
      answers.state = pick(rng, STATES);
      answers.expected_income = pick(rng, ['$20k-$39k', '$40k-$79k', '$80k-$149k']);
      answers.medicare_eligible = rng() < 0.5;
      answers.current_coverage = pick(rng, ['Uninsured', 'Marketplace', 'Employer plan']);
    }

    const signals = extractSignals(vertical, answers, template.questions.length);
    const score = computeScore(signals);
    const qual = deriveQualificationResult(vertical, signals, score.total);

    // Choose a status/stage roughly correlated with score.
    const verticalPipeline = pipelines.find((p) => p.vertical === vertical)!;
    const verticalStages = stages
      .filter((s) => s.pipelineId === verticalPipeline.id)
      .sort((a, b) => a.position - b.position);
    const progress = Math.min(
      verticalStages.length - 1,
      Math.floor((score.total / 100) * (verticalStages.length - 2)),
    );
    const stage = verticalStages[progress]!;
    const status: Lead['status'] =
      score.total >= 75 ? 'qualified' : score.total >= 55 ? 'working' : score.total >= 30 ? 'nurturing' : 'new';
    const assignedAdvisorId = pick(rng, advisorIds);

    leads.push({
      id: leadId,
      organizationId,
      contactId,
      vertical,
      status,
      qualificationStatus: qual.qualificationStatus,
      score: score.total,
      scoreBand: score.band,
      assignedAdvisorId,
      pipelineStageId: stage.id,
      source,
      lastActivityAt: iso(Math.max(0, daysAgo - 1), 14),
      createdAt: iso(daysAgo),
      updatedAt: iso(Math.max(0, daysAgo - 1)),
    });

    leadScores.push({
      id: `${leadId}_score`,
      organizationId,
      leadId,
      total: score.total,
      band: score.band,
      breakdown: score.breakdown,
      computedByRuleVersion: score.ruleVersion,
      createdAt: iso(daysAgo),
      updatedAt: iso(daysAgo),
    });

    qualificationSessions.push({
      id: `${leadId}_qual`,
      organizationId,
      leadId,
      vertical,
      templateId: template.id,
      answers,
      result: qual,
      completedAt: iso(daysAgo, 10),
      createdAt: iso(daysAgo),
      updatedAt: iso(daysAgo),
    });

    consents.push({
      id: `${leadId}_consent`,
      organizationId,
      leadId,
      type: 'sms',
      status: 'granted',
      capturedSource: source,
      capturedAt: iso(daysAgo),
      createdAt: iso(daysAgo),
      updatedAt: iso(daysAgo),
    });

    // Timeline: creation + qualification + score (contributes to 50+ events).
    timeline.push(
      { id: `${leadId}_t0`, organizationId, leadId, at: iso(daysAgo, 8), actorType: 'system', type: 'lead_created', label: `Lead captured from ${source}` },
      { id: `${leadId}_t1`, organizationId, leadId, at: iso(daysAgo, 10), actorType: 'ai', type: 'qualified', label: `AI qualification: ${qual.qualificationStatus}` },
      { id: `${leadId}_t2`, organizationId, leadId, at: iso(daysAgo, 11), actorType: 'automation', type: 'scored', label: `Lead scored ${score.total} (${score.band})` },
    );

    // A couple of messages per lead.
    const convId = `${leadId}_conv`;
    messages.push(
      { id: `${leadId}_msg0`, organizationId, conversationId: convId, leadId, channel: 'sms', direction: 'outbound', body: `Hi ${firstName}, thanks for reaching out! When works for a quick call?`, authorType: 'automation', sentAt: iso(daysAgo, 12), createdAt: iso(daysAgo, 12) } as Message,
    );
    if (score.total >= 40) {
      messages.push({ id: `${leadId}_msg1`, organizationId, conversationId: convId, leadId, channel: 'sms', direction: 'inbound', body: 'Sounds good — mornings are better for me.', authorType: 'human', sentAt: iso(daysAgo, 13), createdAt: iso(daysAgo, 13) } as Message);
    }

    if (rng() < 0.4) {
      notes.push({ id: `${leadId}_note`, organizationId, leadId, authorProfileId: assignedAdvisorId, body: 'Left voicemail, following up tomorrow.', createdAt: iso(Math.max(0, daysAgo - 1), 15), updatedAt: iso(Math.max(0, daysAgo - 1), 15) });
    }
    if (score.total >= 55) {
      tasks.push({ id: `${leadId}_task`, organizationId, leadId, assignedProfileId: assignedAdvisorId, title: 'Prepare recommendation summary', dueAt: iso(-2, 16), completedAt: null, createdAt: iso(daysAgo, 16), updatedAt: iso(daysAgo, 16) });
    }

    // Opportunity for engaged leads.
    if (score.total >= 45) {
      opportunities.push({
        id: `${leadId}_opp`,
        organizationId,
        leadId,
        pipelineId: verticalPipeline.id,
        stageId: stage.id,
        name: `${firstName} ${lastName} — ${vertical === 'financial_advisor' ? 'Retirement Plan' : 'Health Coverage'}`,
        monetaryValue: 500 + Math.floor(rng() * 4500),
        status: 'open',
        assignedAdvisorId,
        createdAt: iso(daysAgo),
        updatedAt: iso(Math.max(0, daysAgo - 1)),
      });
    }
  }

  // --- Appointments (10 on the primary org) ----------------------------------
  const apptCount = leadCount >= 20 ? 10 : 3;
  const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, apptCount);
  topLeads.forEach((lead, i) => {
    const inFuture = i % 2 === 0;
    const day = inFuture ? -(i + 1) : i + 1;
    const status: Appointment['status'] = inFuture
      ? 'scheduled'
      : i % 3 === 0
        ? 'no_show'
        : 'completed';
    appointments.push({
      id: `${organizationId}_appt${i}`,
      organizationId,
      leadId: lead.id,
      advisorId: lead.assignedAdvisorId ?? null,
      title: lead.vertical === 'financial_advisor' ? 'Retirement Review' : 'Coverage Consultation',
      startsAt: iso(day, 15),
      endsAt: iso(day, 16),
      status,
      meetingUrl: 'https://meet.demo/aion',
      createdAt: iso(Math.abs(day) + 2, 9),
      updatedAt: iso(1, 9),
    });
    timeline.push({
      id: `${organizationId}_appt${i}_t`,
      organizationId,
      leadId: lead.id,
      at: iso(Math.abs(day) + 2, 9),
      actorType: 'human',
      type: 'appointment_booked',
      label: `Appointment ${status}`,
    });
  });

  // --- Applications (6) + policies (4 active) --------------------------------
  const appLeads = topLeads.slice(0, 6);
  appLeads.forEach((lead, i) => {
    const submitted = i < 4;
    applications.push({
      id: `${organizationId}_app${i}`,
      organizationId,
      leadId: lead.id,
      productType: lead.vertical === 'financial_advisor' ? 'Term Life' : 'Medicare Advantage',
      carrier: pick(rng, ['Pacific Life', 'Mutual of Omaha', 'Aetna', 'Humana']),
      status: submitted ? 'submitted' : 'documents_pending',
      faceAmount: lead.vertical === 'financial_advisor' ? 250000 : undefined,
      submittedAt: submitted ? iso(i + 3, 12) : undefined,
      createdAt: iso(i + 5, 12),
      updatedAt: iso(1, 12),
    });
    if (i < 4) {
      policies.push({
        id: `${organizationId}_pol${i}`,
        organizationId,
        leadId: lead.id,
        applicationId: `${organizationId}_app${i}`,
        policyNumber: `POL-${config.slug.toUpperCase()}-${1000 + i}`,
        carrier: pick(rng, ['Pacific Life', 'Aetna', 'Humana']),
        productType: lead.vertical === 'financial_advisor' ? 'Term Life' : 'Medicare Advantage',
        status: 'active',
        premium: 80 + Math.floor(rng() * 320),
        effectiveDate: iso(i + 1).slice(0, 10),
        renewalDate: iso(-40 - i).slice(0, 10),
        createdAt: iso(i + 2, 12),
        updatedAt: iso(1, 12),
      });
    }
  });

  // --- Campaigns (5) ---------------------------------------------------------
  // `visits` is top-of-funnel traffic; the visit→lead ratio varies by channel
  // (paid social converts coldest, referrals warmest) so source math is realistic.
  const cmpLeads = (frac: number) => Math.max(1, Math.round(leadCount * frac));
  const campaigns: DemoCampaign[] = [
    { id: `${organizationId}_cmp0`, organizationId, name: 'Meta Retirement Webinar', channel: 'paid_social', spend: 2400, leadsGenerated: cmpLeads(0.3), visits: cmpLeads(0.3) * 25 },
    { id: `${organizationId}_cmp1`, organizationId, name: 'Google Search — Medicare', channel: 'search', spend: 3100, leadsGenerated: cmpLeads(0.25), visits: cmpLeads(0.25) * 13 },
    { id: `${organizationId}_cmp2`, organizationId, name: 'Referral Program', channel: 'referral', spend: 500, leadsGenerated: cmpLeads(0.2), visits: cmpLeads(0.2) * 3 },
    { id: `${organizationId}_cmp3`, organizationId, name: 'Local Seminar Series', channel: 'event', spend: 1800, leadsGenerated: cmpLeads(0.15), visits: cmpLeads(0.15) * 5 },
    { id: `${organizationId}_cmp4`, organizationId, name: 'Email Nurture — Q3', channel: 'email', spend: 300, leadsGenerated: cmpLeads(0.1), visits: cmpLeads(0.1) * 8 },
  ];

  // --- Inject the scripted Marcus Johnson pilot journey (config-driven) -------
  if (config.demoJourney === 'marcus-johnson') {
    const faPipeline = pipelines.find((p) => p.vertical === 'financial_advisor')!;
    // "Appointment Booked" is index 5 of the Financial Advisor pipeline template.
    const apptStage = stages.find((s) => s.pipelineId === faPipeline.id && s.name === 'Appointment Booked')!;
    const m = buildMarcusJohnson(organizationId, profiles[0]!.id, faPipeline.id, apptStage.id);
    // Prepend so Marcus is the first, front-and-center lead for the demo.
    contacts.unshift(m.contact);
    leads.unshift(m.lead);
    leadScores.unshift(m.score);
    qualificationSessions.unshift(m.qualification);
    consents.unshift(...m.consents);
    opportunities.unshift(m.opportunity);
    appointments.unshift(m.appointment);
    messages.unshift(...m.messages);
    notes.unshift(m.note);
    tasks.unshift(m.task);
    timeline.unshift(...m.timeline);
  }

  const scheduling = buildScheduling(organizationId, config.slug, profiles);

  return {
    organization,
    settings: makeSettings(organizationId),
    profiles,
    memberships,
    pipelines,
    stages,
    contacts,
    leads,
    leadScores,
    qualificationSessions,
    opportunities,
    appointments,
    messages,
    notes,
    tasks,
    applications,
    policies,
    consents,
    campaigns,
    timeline,
    calendars: scheduling.calendars,
    sharedTasks: scheduling.sharedTasks,
  };
}

// --- Marcus Johnson — the scripted pilot presentation journey ----------------

/** Stable ids for the scripted Marcus Johnson demo lead (Ben Peretz tenant). */
export const MARCUS_LEAD_ID = 'org_ben-peretz_marcus';
export const MARCUS_CONTACT_ID = 'org_ben-peretz_marcus_contact';

/** The exact qualification answers Marcus submits in the Financial Protection Checkup. */
export const MARCUS_ANSWERS: Record<string, unknown> = {
  age_range: '50-59',
  employment_status: 'Employed',
  household_income: '$100k-$199k',
  investable_assets: '$1M-$4.9M',
  retirement_timeline: '5-10 years',
  financial_concerns: 'Protecting my family’s income and leaving a clean legacy',
  existing_advisor: false,
  insurance_ownership: false,
  estate_planning_needs: true,
  college_planning_needs: true,
  debt_concerns: false,
  tax_planning_interest: true,
  appointment_urgency: 'ASAP',
  preferred_channel: 'Phone',
};

/** Expected tags applied to Marcus on qualification (shown in the journey). */
export const MARCUS_TAGS = [
  'High Priority',
  'Financial Protection',
  'Retirement Income',
  'Estate Planning',
  'Appointment Ready',
];

interface MarcusBundle {
  contact: Contact;
  lead: Lead;
  score: LeadScore;
  qualification: LeadQualificationSession;
  consents: ConsentRecord[];
  opportunity: Opportunity;
  appointment: Appointment;
  messages: Message[];
  note: Note;
  task: Task;
  timeline: TimelineEvent[];
}

/**
 * Build the scripted Marcus Johnson journey. The score is computed by the same
 * deterministic engine as every other lead (no hard-coding) and is guaranteed —
 * and asserted in tests — to land in the 80–88 high-priority band.
 */
function buildMarcusJohnson(
  organizationId: string,
  advisorId: string,
  faPipelineId: string,
  appointmentBookedStageId: string,
): MarcusBundle {
  const template = templateForVertical('financial_advisor');
  const signals = extractSignals('financial_advisor', MARCUS_ANSWERS, template.questions.length);
  const score = computeScore(signals);

  const result: QualificationResult = {
    qualificationStatus: 'high_priority',
    intentScore: Math.round(signals.intent ?? 90),
    urgencyScore: Math.round(signals.urgency ?? 100),
    productInterests: ['Income protection', 'Estate planning', 'Retirement income planning'],
    needsSummary:
      'Marcus (54) is the primary earner for a household of four. He wants to protect his ' +
      'family’s income against loss, put an estate plan in place, and coordinate college and ' +
      'retirement funding. No current advisor. Ready to meet this week. Advisor review required ' +
      'before any recommendation.',
    objections: ['Wants to understand fees clearly'],
    missingInformation: ['Existing coverage amounts'],
    recommendedNextAction: 'Call within the hour and confirm the Financial Protection Review appointment.',
    appointmentReady: true,
  };

  const contact: Contact = {
    id: MARCUS_CONTACT_ID,
    organizationId,
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.johnson@example.com',
    phone: '5551180424',
    state: 'NJ',
    timezone: 'America/New_York',
    source: 'web_form',
    createdAt: iso(2, 9),
    updatedAt: iso(0, 14),
  };

  const lead: Lead = {
    id: MARCUS_LEAD_ID,
    organizationId,
    contactId: MARCUS_CONTACT_ID,
    vertical: 'financial_advisor',
    status: 'appointment_set',
    qualificationStatus: 'high_priority',
    score: score.total,
    scoreBand: score.band,
    assignedAdvisorId: advisorId,
    pipelineStageId: appointmentBookedStageId,
    source: 'web_form',
    lastActivityAt: iso(0, 14),
    createdAt: iso(2, 9),
    updatedAt: iso(0, 14),
  };

  const leadScore: LeadScore = {
    id: `${MARCUS_LEAD_ID}_score`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    total: score.total,
    band: score.band,
    breakdown: score.breakdown,
    computedByRuleVersion: score.ruleVersion,
    createdAt: iso(2, 9),
    updatedAt: iso(2, 9),
  };

  const qualification: LeadQualificationSession = {
    id: `${MARCUS_LEAD_ID}_qual`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    vertical: 'financial_advisor',
    templateId: template.id,
    answers: MARCUS_ANSWERS,
    result,
    completedAt: iso(2, 9),
    createdAt: iso(2, 9),
    updatedAt: iso(2, 9),
  };

  const consents: ConsentRecord[] = (['sms', 'email', 'call'] as const).map((type) => ({
    id: `${MARCUS_LEAD_ID}_consent_${type}`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    type,
    status: 'granted',
    capturedSource: 'financial_protection_checkup',
    capturedAt: iso(2, 9),
    createdAt: iso(2, 9),
    updatedAt: iso(2, 9),
  }));

  const opportunity: Opportunity = {
    id: `${MARCUS_LEAD_ID}_opp`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    pipelineId: faPipelineId,
    stageId: appointmentBookedStageId,
    name: 'Marcus Johnson — Financial Protection Review',
    monetaryValue: 3800,
    status: 'open',
    assignedAdvisorId: advisorId,
    createdAt: iso(2, 9),
    updatedAt: iso(0, 14),
  };

  const appointment: Appointment = {
    id: `${MARCUS_LEAD_ID}_appt`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    advisorId,
    title: 'Financial Protection Review — Marcus Johnson',
    startsAt: iso(-2, 15),
    endsAt: iso(-2, 16),
    status: 'scheduled',
    meetingUrl: 'https://meet.demo/ben-peretz/marcus',
    createdAt: iso(0, 14),
    updatedAt: iso(0, 14),
  };

  const convId = `${MARCUS_LEAD_ID}_conv`;
  const messages: Message[] = [
    {
      id: `${MARCUS_LEAD_ID}_msg0`,
      organizationId,
      conversationId: convId,
      leadId: MARCUS_LEAD_ID,
      channel: 'sms',
      direction: 'outbound',
      body: 'Hi Marcus, thanks for completing the Financial Protection Checkup! This is Ben Peretz. I have a couple of times open this week — would tomorrow at 3pm work for a quick review?',
      authorType: 'automation',
      sentAt: iso(1, 10),
      createdAt: iso(1, 10),
      updatedAt: iso(1, 10),
    },
    {
      id: `${MARCUS_LEAD_ID}_msg1`,
      organizationId,
      conversationId: convId,
      leadId: MARCUS_LEAD_ID,
      channel: 'sms',
      direction: 'inbound',
      body: 'That works — 3pm tomorrow is great. Looking forward to it.',
      authorType: 'human',
      sentAt: iso(1, 11),
      createdAt: iso(1, 11),
      updatedAt: iso(1, 11),
    },
  ];

  const note: Note = {
    id: `${MARCUS_LEAD_ID}_note`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    authorProfileId: advisorId,
    body: 'Primary earner, family of four. Strong fit for income protection + estate planning. Confirm existing coverage on the call.',
    createdAt: iso(1, 12),
    updatedAt: iso(1, 12),
  };

  const task: Task = {
    id: `${MARCUS_LEAD_ID}_task`,
    organizationId,
    leadId: MARCUS_LEAD_ID,
    assignedProfileId: advisorId,
    title: 'Prepare Financial Protection Review brief for Marcus Johnson',
    dueAt: iso(-2, 13),
    completedAt: null,
    createdAt: iso(1, 12),
    updatedAt: iso(1, 12),
  };

  // A rich timeline mirroring the 12-stage presentation journey.
  const timeline: TimelineEvent[] = [
    { id: `${MARCUS_LEAD_ID}_t0`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'system', type: 'checkup_started', label: 'Started the Financial Protection Checkup' },
    { id: `${MARCUS_LEAD_ID}_t1`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'human', type: 'contact_captured', label: 'Contact captured with SMS, email, and call consent' },
    { id: `${MARCUS_LEAD_ID}_t2`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'human', type: 'qualification_completed', label: 'Completed all qualification questions' },
    { id: `${MARCUS_LEAD_ID}_t3`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'automation', type: 'scored', label: `Deterministic score ${score.total} — ${score.band.replace(/_/g, ' ')}` },
    { id: `${MARCUS_LEAD_ID}_t4`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'automation', type: 'tagged', label: `Tagged: ${MARCUS_TAGS.join(', ')}` },
    { id: `${MARCUS_LEAD_ID}_t5`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'ai', type: 'education_sent', label: 'Personalized educational results generated' },
    { id: `${MARCUS_LEAD_ID}_t6`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(2, 9), actorType: 'system', type: 'crm_lead_created', label: 'CRM lead created and assigned to Ben Peretz' },
    { id: `${MARCUS_LEAD_ID}_t7`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(1, 10), actorType: 'automation', type: 'pipeline_moved', label: 'Moved to “Appointment Booked” stage' },
    { id: `${MARCUS_LEAD_ID}_t8`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(1, 10), actorType: 'automation', type: 'follow_up', label: 'Automated follow-up simulated (no external send)' },
    { id: `${MARCUS_LEAD_ID}_t9`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(1, 11), actorType: 'human', type: 'appointment_booked', label: 'Financial Protection Review booked' },
    { id: `${MARCUS_LEAD_ID}_t10`, organizationId, leadId: MARCUS_LEAD_ID, at: iso(0, 13), actorType: 'ai', type: 'advisor_brief', label: 'Advisor preparation brief generated' },
  ];

  return { contact, lead, score: leadScore, qualification, consents, opportunity, appointment, messages, note, task, timeline };
}

// --- Calendars + shared tasks (native scheduling layer) ----------------------

const BUSINESS_WEEK: WeeklyAvailability = {
  1: [{ start: '09:00', end: '17:00' }],
  2: [{ start: '09:00', end: '17:00' }],
  3: [{ start: '09:00', end: '17:00' }],
  4: [{ start: '09:00', end: '17:00' }],
  5: [{ start: '09:00', end: '15:00' }],
};

function buildScheduling(
  organizationId: string,
  slug: string,
  profiles: Profile[],
): { calendars: Calendar[]; sharedTasks: SharedTask[] } {
  const memberIds = profiles.slice(0, 3).map((p) => p.id);
  const base = { organizationId, tzOffsetMinutes: -240, timezoneLabel: 'America/New_York (ET)', isActive: true };

  const calendars: Calendar[] = [
    {
      ...base,
      id: `${organizationId}_cal_growth`,
      name: 'Advisor Growth Review',
      slug: `${slug}-growth-review`,
      type: 'round_robin',
      description: 'Round-robin 15-minute review — the next available team member is assigned automatically.',
      memberIds,
      slotMinutes: 30,
      bufferMinutes: 10,
      minNoticeHours: 12,
      meetingLocation: 'Google Meet (link sent on confirmation)',
      availability: BUSINESS_WEEK,
    },
    {
      ...base,
      id: `${organizationId}_cal_strategy`,
      name: 'Client Strategy Session',
      slug: `${slug}-strategy`,
      type: 'collective',
      description: 'Collective calendar — a slot is only offered when everyone required is free.',
      memberIds: memberIds.slice(0, 2),
      slotMinutes: 45,
      bufferMinutes: 15,
      minNoticeHours: 24,
      meetingLocation: 'Office or video',
      availability: { 1: [{ start: '10:00', end: '15:00' }], 3: [{ start: '10:00', end: '15:00' }] },
    },
    {
      ...base,
      id: `${organizationId}_cal_intro`,
      name: `Intro with ${profiles[0]?.fullName ?? 'Advisor'}`,
      slug: `${slug}-intro`,
      type: 'individual',
      description: 'One-on-one introductory call.',
      memberIds: memberIds.slice(0, 1),
      slotMinutes: 20,
      bufferMinutes: 5,
      minNoticeHours: 4,
      meetingLocation: 'Phone',
      availability: BUSINESS_WEEK,
    },
  ];

  const sharedTasks: SharedTask[] = [
    {
      id: `${organizationId}_stask0`,
      organizationId,
      title: 'Confirm this week’s Advisor Growth Review bookings',
      assigneeId: profiles[1]?.id ?? null,
      dueAt: iso(-1, 17),
      status: 'open',
      createdAt: iso(2, 9),
      updatedAt: iso(1, 9),
    },
    {
      id: `${organizationId}_stask1`,
      organizationId,
      title: 'Prepare prep briefs for tomorrow’s calls',
      assigneeId: profiles[0]?.id ?? null,
      dueAt: iso(0, 12),
      status: 'in_progress',
      createdAt: iso(1, 9),
      updatedAt: iso(0, 9),
    },
    {
      id: `${organizationId}_stask2`,
      organizationId,
      title: 'Follow up with no-shows from last week',
      assigneeId: profiles[2]?.id ?? null,
      dueAt: iso(-2, 16),
      status: 'open',
      createdAt: iso(3, 9),
      updatedAt: iso(2, 9),
    },
    {
      id: `${organizationId}_stask3`,
      organizationId,
      title: 'Update the team availability for next month',
      assigneeId: null,
      dueAt: iso(-7, 15),
      status: 'done',
      createdAt: iso(6, 9),
      updatedAt: iso(4, 9),
    },
  ];

  return { calendars, sharedTasks };
}

/**
 * Generate the full demo world from the client registry — one tenant per
 * registered ClientConfig. The primary client (index 0) is the rich pilot
 * tenant; additional clients prove the same engine serves multiple advisors and
 * that tenants stay isolated. Each client's seedOffset keeps its world distinct.
 */
export function generateDemoWorld(seed = 42): DemoWorld {
  return {
    orgs: CLIENT_CONFIGS.map((config) => buildOrg(config, seed)),
  };
}

/** Convenience: the primary demo tenant. */
export function generatePrimaryDemoOrg(seed = 42): DemoOrg {
  return generateDemoWorld(seed).orgs[0]!;
}
