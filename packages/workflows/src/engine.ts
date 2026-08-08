/**
 * Minimal workflow engine. Executes a definition's steps in order against a
 * registry of handlers, with per-step retry and safe failure. Steps flagged
 * `requiresApproval` short-circuit into an awaiting_approval state rather than
 * running — AI/automation never triggers irreversible actions unattended.
 */
import { logger as rootLogger, type Logger } from '@aion/shared';
import type {
  StepHandler,
  StepResult,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowRunResult,
} from './types.js';

export class WorkflowEngine {
  private readonly handlers = new Map<string, StepHandler>();
  private readonly log: Logger;

  constructor(logger?: Logger) {
    this.log = logger ?? rootLogger.child({ component: 'workflow-engine' });
  }

  register(action: string, handler: StepHandler): this {
    this.handlers.set(action, handler);
    return this;
  }

  async run(def: WorkflowDefinition, ctx: WorkflowContext): Promise<WorkflowRunResult> {
    const results: StepResult[] = [];
    const log = this.log.child({ workflowKey: def.key, correlationId: ctx.correlationId });

    for (const step of def.steps) {
      if (step.requiresApproval) {
        log.info('step awaiting approval', { stepId: step.id });
        results.push({ stepId: step.id, status: 'awaiting_approval', attempts: 0 });
        // Human-in-the-loop gate: stop the automated portion here.
        break;
      }

      const handler = this.handlers.get(step.action);
      if (!handler) {
        log.warn('no handler registered; skipping', { action: step.action });
        results.push({ stepId: step.id, status: 'skipped', attempts: 0 });
        continue;
      }

      const maxAttempts = step.retry?.maxAttempts ?? 1;
      const backoff = step.retry?.backoffMs ?? 0;
      let attempts = 0;
      let lastError: string | undefined;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const output = await handler(ctx, step);
          if (output) Object.assign(ctx.data, output);
          results.push({ stepId: step.id, status: 'completed', attempts, output: output || undefined });
          lastError = undefined;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          log.warn('step failed', { stepId: step.id, attempts, error: lastError });
          if (attempts < maxAttempts && backoff > 0) await sleep(backoff * attempts);
        }
      }

      if (lastError) {
        results.push({ stepId: step.id, status: 'failed', attempts, error: lastError });
        // Fail the run but preserve step history for retry/observability.
        return { workflowKey: def.key, status: 'failed', steps: results };
      }
    }

    const status = results.some((r) => r.status === 'awaiting_approval')
      ? 'partial'
      : 'completed';
    return { workflowKey: def.key, status, steps: results };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
