/**
 * Workflow step handlers for the worker. In the skeleton these log the action
 * they *would* perform (and respect demo mode). Wire them to real services
 * (GHL, AI, notifications) as those integrations go live — the workflow
 * definitions and engine do not change.
 */
import { AIGateway, createProvider, generateAdvisorBrief } from '@aion/ai';
import { logger, loadEnv } from '@aion/shared';
import { WorkflowEngine, type StepHandler } from '@aion/workflows';

const log = logger.child({ service: 'worker' });
const env = loadEnv();
const gateway = new AIGateway(
  createProvider({
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  }),
);

const noop =
  (label: string): StepHandler =>
  async (ctx, step) => {
    log.info(`step: ${label}`, { workflowStep: step.id, leadId: ctx.leadId, demoMode: ctx.demoMode });
  };

export function buildEngine(): WorkflowEngine {
  const engine = new WorkflowEngine(log);

  // New-lead workflow handlers.
  engine
    .register('normalize_data', noop('normalize data'))
    .register('check_duplicate', noop('check duplicate'))
    .register('ghl_upsert_contact', noop('upsert contact in GoHighLevel'))
    .register('assign_lead_source', noop('assign lead source'))
    .register('start_ai_qualification', noop('start AI qualification'))
    .register('calculate_lead_score', noop('calculate lead score'))
    .register('add_to_pipeline', noop('add to pipeline'))
    .register('notify_advisor', noop('notify assigned advisor'))
    .register('start_nurture', noop('begin nurture sequence'));

  // Appointment-booking handlers, incl. a real AI advisor brief.
  engine
    .register('confirm_appointment', noop('confirm appointment'))
    .register('send_calendar_details', noop('send calendar details'))
    .register('send_intake_questionnaire', noop('send intake questionnaire'))
    .register('generate_advisor_brief', async (ctx, step) => {
      const brief = await generateAdvisorBrief(gateway, {
        leadSummary: String(ctx.data.summary ?? 'Lead needs a retirement review.'),
        answers: (ctx.data.answers as Record<string, unknown>) ?? {},
      });
      log.info('generated advisor brief', { ok: brief.ok, workflowStep: step.id });
      return brief.ok ? { advisorBrief: brief.data } : undefined;
    })
    .register('schedule_reminder', noop('schedule reminder'));

  return engine;
}
