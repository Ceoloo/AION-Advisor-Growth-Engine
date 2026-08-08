import { describe, expect, it } from 'vitest';
import { WorkflowEngine } from '../engine.js';
import type { WorkflowContext, WorkflowDefinition } from '../types.js';
import { WORKFLOW_DEFINITIONS, getWorkflow } from '../definitions/index.js';

const ctx = (): WorkflowContext => ({
  organizationId: 'org_1',
  leadId: 'lead_1',
  correlationId: 'corr_1',
  data: {},
  demoMode: true,
});

describe('WorkflowEngine', () => {
  it('runs steps in order and threads output into context', async () => {
    const def: WorkflowDefinition = {
      key: 't',
      name: 'test',
      description: '',
      trigger: 'lead.created',
      steps: [
        { id: 'a', action: 'a', label: 'A' },
        { id: 'b', action: 'b', label: 'B' },
      ],
    };
    const engine = new WorkflowEngine()
      .register('a', async () => ({ fromA: 1 }))
      .register('b', async (c) => {
        expect(c.data.fromA).toBe(1);
      });
    const result = await engine.run(def, ctx());
    expect(result.status).toBe('completed');
    expect(result.steps.map((s) => s.status)).toEqual(['completed', 'completed']);
  });

  it('retries a transient failure then fails safe', async () => {
    let calls = 0;
    const def: WorkflowDefinition = {
      key: 't',
      name: 'test',
      description: '',
      trigger: 'lead.created',
      steps: [{ id: 'x', action: 'x', label: 'X', retry: { maxAttempts: 3, backoffMs: 0 } }],
    };
    const engine = new WorkflowEngine().register('x', async () => {
      calls++;
      throw new Error('boom');
    });
    const result = await engine.run(def, ctx());
    expect(calls).toBe(3);
    expect(result.status).toBe('failed');
    expect(result.steps[0]?.attempts).toBe(3);
  });

  it('halts at an approval-gated step', async () => {
    const def: WorkflowDefinition = {
      key: 't',
      name: 'test',
      description: '',
      trigger: 'appointment.completed',
      steps: [
        { id: 'gate', action: 'gate', label: 'Gate', requiresApproval: true },
        { id: 'after', action: 'after', label: 'After' },
      ],
    };
    let ran = false;
    const engine = new WorkflowEngine().register('after', async () => {
      ran = true;
    });
    const result = await engine.run(def, ctx());
    expect(ran).toBe(false);
    expect(result.status).toBe('partial');
    expect(result.steps[0]?.status).toBe('awaiting_approval');
  });

  it('ships the documented workflow definitions', () => {
    expect(WORKFLOW_DEFINITIONS).toHaveLength(7);
    expect(getWorkflow('new_lead')?.steps.length).toBeGreaterThan(0);
    expect(getWorkflow('scorecard_nurture')?.trigger).toBe('scorecard.completed');
  });
});
