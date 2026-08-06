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

interface OrgSpec {
  name: string;
  slug: string;
  isDemo: boolean;
  leadCount: number;
  seed: number;
  primaryVertical: IndustryVertical;
}

function buildOrg(spec: OrgSpec): DemoOrg {
  const rng = seededRandom(spec.seed);
  const organizationId = `org_${spec.slug}`;

  const organization: Organization = {
    id: organizationId,
    createdAt: iso(120),
    updatedAt: iso(1),
    name: spec.name,
    slug: spec.slug,
    type: spec.primaryVertical === 'health_insurance' ? 'health_insurance_brokerage' : 'financial_advisor',
    primaryVertical: spec.primaryVertical,
    isDemo: spec.isDemo,
  };

  // --- Advisor profiles + memberships (3 advisors + 1 admin) -----------------
  const advisorSpecs: { name: string; role: Role }[] = [
    { name: 'Alex Morgan', role: 'agency_administrator' },
    { name: 'Jordan Blake', role: 'financial_advisor' },
    { name: 'Taylor Reed', role: 'insurance_agent' },
    { name: 'Casey Vaughn', role: 'appointment_setter' },
  ];
  const profiles: Profile[] = advisorSpecs.map((a, i) => ({
    id: `${organizationId}_p${i}`,
    authUserId: `auth_${spec.slug}_${i}`,
    fullName: a.name,
    email: `${a.name.split(' ')[0]!.toLowerCase()}@${spec.slug}.demo`,
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
  const advisorIds = profiles.filter((_, i) => i >= 1 && i <= 2).map((p) => p.id);

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
      isDefault: tpl.vertical === spec.primaryVertical,
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

  for (let i = 0; i < spec.leadCount; i++) {
    const vertical: IndustryVertical =
      spec.primaryVertical === 'health_insurance'
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
  const apptCount = spec.leadCount >= 20 ? 10 : 3;
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
        policyNumber: `POL-${spec.slug.toUpperCase()}-${1000 + i}`,
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
  const campaigns: DemoCampaign[] = [
    { id: `${organizationId}_cmp0`, organizationId, name: 'Meta Retirement Webinar', channel: 'paid_social', spend: 2400, leadsGenerated: Math.round(spec.leadCount * 0.3) },
    { id: `${organizationId}_cmp1`, organizationId, name: 'Google Search — Medicare', channel: 'search', spend: 3100, leadsGenerated: Math.round(spec.leadCount * 0.25) },
    { id: `${organizationId}_cmp2`, organizationId, name: 'Referral Program', channel: 'referral', spend: 500, leadsGenerated: Math.round(spec.leadCount * 0.2) },
    { id: `${organizationId}_cmp3`, organizationId, name: 'Local Seminar Series', channel: 'event', spend: 1800, leadsGenerated: Math.round(spec.leadCount * 0.15) },
    { id: `${organizationId}_cmp4`, organizationId, name: 'Email Nurture — Q3', channel: 'email', spend: 300, leadsGenerated: Math.round(spec.leadCount * 0.1) },
  ];

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
  };
}

/** Generate the full demo world: a rich primary tenant + a second tenant. */
export function generateDemoWorld(seed = 42): DemoWorld {
  return {
    orgs: [
      buildOrg({
        name: 'AION Demo Agency',
        slug: 'aion-demo',
        isDemo: true,
        leadCount: 32,
        seed,
        primaryVertical: 'financial_advisor',
      }),
      // Second tenant proves isolation — its records must never leak into the first.
      buildOrg({
        name: 'Second Tenant Insurance',
        slug: 'second-tenant',
        isDemo: true,
        leadCount: 8,
        seed: seed + 7,
        primaryVertical: 'health_insurance',
      }),
    ],
  };
}

/** Convenience: the primary demo tenant. */
export function generatePrimaryDemoOrg(seed = 42): DemoOrg {
  return generateDemoWorld(seed).orgs[0]!;
}
