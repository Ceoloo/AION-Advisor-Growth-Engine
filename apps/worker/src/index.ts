/**
 * AION worker service. Processes background jobs: webhook processing, lead
 * enrichment/scoring, AI summaries, scheduled follow-ups and reminders,
 * re-engagement, analytics aggregation, and failed-job retries.
 *
 * The skeleton demonstrates the engine end-to-end by running the New Lead and
 * Appointment Booking workflows against a seeded demo lead, then keeps a
 * heartbeat scheduler tick. Run with `pnpm --filter @aion/worker dev`.
 * Set WORKER_ONCE=true to run a single pass and exit (used in CI).
 */
import { getWorkflow } from '@aion/workflows';
import { getDemoStore } from '@aion/database';
import { logger, loadEnv, newCorrelationId } from '@aion/shared';
import { buildEngine } from './handlers.js';

const log = logger.child({ service: 'worker' });

async function runOnce(): Promise<void> {
  const env = loadEnv();
  const engine = buildEngine();
  const store = getDemoStore();
  const org = store.listOrganizations()[0]!;
  const lead = store.org(org.id)!.leads[0]!;

  for (const key of ['new_lead', 'appointment_booking']) {
    const def = getWorkflow(key);
    if (!def) continue;
    const result = await engine.run(def, {
      organizationId: org.id,
      leadId: lead.id,
      correlationId: newCorrelationId(),
      data: { summary: 'Pre-retiree wants a retirement income review.', answers: {} },
      demoMode: env.DEMO_MODE,
    });
    log.info('workflow completed', {
      workflow: key,
      status: result.status,
      steps: result.steps.length,
    });
  }
}

async function main(): Promise<void> {
  log.info('worker starting', { demoMode: loadEnv().DEMO_MODE });
  await runOnce();

  if (process.env.WORKER_ONCE === 'true') {
    log.info('WORKER_ONCE set — exiting after one pass');
    return;
  }

  // Heartbeat scheduler: in production this polls sync_jobs / due reminders.
  const interval = setInterval(() => {
    log.debug('scheduler tick — checking for due jobs (none in demo)');
  }, 60_000);

  const shutdown = () => {
    clearInterval(interval);
    log.info('worker shutting down');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();
