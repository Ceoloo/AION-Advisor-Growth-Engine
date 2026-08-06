import { Card, Badge } from '@aion/ui';
import { WORKFLOW_DEFINITIONS } from '@aion/workflows';
import { PageHeader } from '@/components/page-header';

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        title="Workflows"
        description="Declarative automation definitions (JSON) — editable via a visual builder in future. Steps flagged for approval pause for a human."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {WORKFLOW_DEFINITIONS.map((wf) => (
          <Card key={wf.key} className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{wf.name}</h3>
              <Badge tone="blue">{wf.trigger}</Badge>
            </div>
            <p className="mb-3 text-xs text-slate-500">{wf.description}</p>
            <ol className="space-y-1.5">
              {wf.steps.map((step, i) => (
                <li key={step.id} className="flex items-center gap-2 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/5 text-[10px] text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">{step.label}</span>
                  {step.requiresApproval && <Badge tone="amber">approval</Badge>}
                  {step.retry && <Badge tone="neutral">retry×{step.retry.maxAttempts}</Badge>}
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </>
  );
}
