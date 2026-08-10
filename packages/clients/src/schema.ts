/**
 * Runtime validation for ClientConfig. Configs are validated at registration
 * time so a malformed or half-authored client can never silently reach the
 * engine. The schema mirrors ./types.ts exactly.
 */
import { z } from 'zod';
import { INDUSTRY_VERTICALS, LAUNCH_APPROVAL_ITEMS, ROLES } from '@aion/types';
import {
  CALENDAR_PROVIDERS,
  CLIENT_APPROVAL_STATUSES,
  CLIENT_COMPLIANCE_STATUSES,
  CRM_PROVIDERS,
} from './types.js';

const teamMember = z.object({
  name: z.string().min(1),
  role: z.enum(ROLES),
  receivesLeads: z.boolean().optional(),
});

const followupStep = z.object({
  afterHours: z.number().min(0),
  channel: z.enum(['sms', 'email', 'call', 'task']),
  label: z.string().min(1),
});

const advisorProfile = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  headshot: z.string().optional(),
  licensedStates: z.array(z.string().length(2)),
  serviceArea: z.string().min(1),
});

const brandAssets = z.object({
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  logo: z.string().optional(),
  extra: z.record(z.string()).optional(),
});

const funnelSnapshot = z.object({
  periodLabel: z.string().min(1),
  note: z.string().optional(),
  traffic: z.number().min(0),
  leads: z.number().min(0),
  qualified: z.number().min(0),
  appointments: z.number().min(0),
  showed: z.number().min(0),
  consultations: z.number().min(0),
  opportunities: z.number().min(0),
  clients: z.number().min(0),
  verifiedRevenue: z.number().min(0),
  spend: z.number().min(0).optional(),
  responseTimeMinutes: z.number().min(0).optional(),
});

export const ClientConfigSchema = z
  .object({
    clientId: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, 'clientId must be lowercase kebab-case'),
    organizationId: z.string().min(2),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
    displayName: z.string().min(1),
    vertical: z.enum(INDUSTRY_VERTICALS),
    advisor: advisorProfile,
    brand: brandAssets,
    primaryAudience: z.string().min(1),
    planningAreas: z.array(z.string().min(1)).min(1),
    bookingUrl: z.string().url().optional(),
    providers: z.object({
      crm: z.enum(CRM_PROVIDERS),
      calendar: z.enum(CALENDAR_PROVIDERS),
    }),
    leadSources: z.array(z.string().min(1)).min(1),
    followupCadence: z.array(followupStep),
    team: z.array(teamMember).min(1),
    compliance: z.object({
      status: z.enum(CLIENT_COMPLIANCE_STATUSES),
      reviewedBy: z.string().optional(),
      notes: z.string().optional(),
    }),
    approval: z.object({
      status: z.enum(CLIENT_APPROVAL_STATUSES),
      approvedBy: z.string().optional(),
      approvedAt: z.string().optional(),
    }),
    baseline: funnelSnapshot.optional(),
    pilotPeriodLabel: z.string().optional(),
    launchApprovals: z
      .record(
        z.enum(LAUNCH_APPROVAL_ITEMS.map((i) => i.key) as [string, ...string[]]),
        z.object({
          approved: z.boolean(),
          approvedBy: z.string().optional(),
          approvedAt: z.string().optional(),
          note: z.string().optional(),
        }),
      )
      .optional(),
    isDemo: z.boolean(),
    demoLeadVolume: z.number().int().min(0),
    seedOffset: z.number().int(),
    demoJourney: z.literal('marcus-johnson').optional(),
  })
  .superRefine((cfg, ctx) => {
    if (!cfg.team.some((m) => m.receivesLeads)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one team member must receive leads (receivesLeads: true).',
        path: ['team'],
      });
    }
    if (cfg.organizationId !== `org_${cfg.slug}`) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'organizationId must equal `org_${slug}`.',
        path: ['organizationId'],
      });
    }
  });

/** Parse + validate a config, throwing a readable error on failure. */
export function parseClientConfig(input: unknown): import('./types.js').ClientConfig {
  const parsed = ClientConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid ClientConfig:\n${issues}`);
  }
  return parsed.data as import('./types.js').ClientConfig;
}
