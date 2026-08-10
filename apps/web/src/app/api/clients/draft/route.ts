import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ClientConfigSchema, type ClientConfig } from '@aion/clients';
import { evaluateLaunchReadiness } from '@aion/compliance';
import { LAUNCH_APPROVAL_ITEMS, type LaunchApprovalState } from '@aion/types';

/**
 * Validate a new-advisor onboarding draft. Assembles the wizard input into a
 * full ClientConfig, runs it through the SAME Zod schema every registered client
 * passes, and reports launch readiness. This proves onboarding is configuration:
 * a valid draft is a working tenant definition — no code, no new app.
 *
 * Demo-safe: this validates and previews only. It does not persist a client
 * (the registry is code-defined); it returns the config that WOULD be created.
 */
const cadenceByVertical = {
  financial_advisor: [
    { afterHours: 0, channel: 'sms' as const, label: 'Instant welcome text (consented)' },
    { afterHours: 1, channel: 'call' as const, label: 'Advisor call within the hour' },
    { afterHours: 24, channel: 'email' as const, label: 'Day-1 recap + booking link' },
  ],
  health_insurance: [
    { afterHours: 0, channel: 'email' as const, label: 'Welcome email + plan checklist' },
    { afterHours: 4, channel: 'call' as const, label: 'Same-day advisor call' },
    { afterHours: 48, channel: 'sms' as const, label: 'Day-2 reminder (consented)' },
  ],
};

const DraftSchema = z.object({
  clientId: z.string().default(''),
  displayName: z.string().default(''),
  advisorName: z.string().default(''),
  advisorTitle: z.string().default(''),
  advisorBio: z.string().default(''),
  vertical: z.enum(['financial_advisor', 'health_insurance']).default('financial_advisor'),
  primaryAudience: z.string().default(''),
  planningAreas: z.array(z.string()).default([]),
  licensedStates: z.array(z.string()).default([]),
  serviceArea: z.string().default(''),
  bookingUrl: z.string().default(''),
  leadSources: z.array(z.string()).default([]),
  scorecardEnabled: z.boolean().default(true),
  crmProvider: z.enum(['gohighlevel', 'airtable', 'none']).default('gohighlevel'),
  calendarProvider: z.enum(['native', 'gohighlevel', 'calendly', 'external']).default('native'),
  approvedBy: z.string().default(''),
  approvals: z.record(z.boolean()).default({}),
});

function assembleConfig(input: z.infer<typeof DraftSchema>): unknown {
  const slug = input.clientId.trim();
  const launchApprovals: LaunchApprovalState = {};
  for (const item of LAUNCH_APPROVAL_ITEMS) {
    const approved = !!input.approvals[item.key];
    launchApprovals[item.key] = approved
      ? { approved: true, approvedBy: input.approvedBy || undefined }
      : { approved: false };
  }

  return {
    clientId: slug,
    organizationId: `org_${slug}`,
    slug,
    displayName: input.displayName,
    vertical: input.vertical,
    advisor: {
      name: input.advisorName,
      title: input.advisorTitle,
      bio: input.advisorBio,
      licensedStates: input.licensedStates,
      serviceArea: input.serviceArea,
    },
    brand: {},
    primaryAudience: input.primaryAudience,
    planningAreas: input.planningAreas,
    bookingUrl: input.bookingUrl || undefined,
    providers: { crm: input.crmProvider, calendar: input.calendarProvider },
    leadSources: input.leadSources,
    followupCadence: cadenceByVertical[input.vertical],
    team: [{ name: input.advisorName, role: 'agency_administrator', receivesLeads: true }],
    compliance: { status: 'in_review' },
    approval: { status: 'draft' },
    launchApprovals,
    isDemo: true,
    demoLeadVolume: 0,
    seedOffset: 0,
  } satisfies Partial<ClientConfig> as unknown;
}

export async function POST(request: Request) {
  const parsed = DraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  }

  const candidate = assembleConfig(parsed.data);
  const validation = ClientConfigSchema.safeParse(candidate);

  if (!validation.success) {
    return NextResponse.json({
      ok: true,
      valid: false,
      issues: validation.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const config = validation.data as ClientConfig;
  const readiness = evaluateLaunchReadiness(config.launchApprovals ?? {});

  return NextResponse.json({
    ok: true,
    valid: true,
    scorecardEnabled: parsed.data.scorecardEnabled,
    config: {
      clientId: config.clientId,
      organizationId: config.organizationId,
      displayName: config.displayName,
      vertical: config.vertical,
      advisor: config.advisor,
      providers: config.providers,
      planningAreas: config.planningAreas,
      leadSources: config.leadSources,
    },
    launch: {
      eligible: readiness.launchEligible,
      approvedCritical: readiness.approvedCritical,
      totalCritical: readiness.totalCritical,
      missing: readiness.missingCritical.map((i) => i.label),
    },
  });
}
