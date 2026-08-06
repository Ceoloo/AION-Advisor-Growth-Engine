import Link from 'next/link';
import { ScoreBadge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatCurrency } from '@/lib/format';

export default function PipelinePage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));

  // Show the default pipeline (primary vertical) as a Kanban board.
  const pipeline = org.pipelines.find((p) => p.isDefault) ?? org.pipelines[0]!;
  const stages = org.stages
    .filter((s) => s.pipelineId === pipeline.id)
    .sort((a, b) => a.position - b.position);
  const leads = org.leads.filter((l) => l.vertical === pipeline.vertical);
  const oppByLead = new Map(org.opportunities.map((o) => [o.leadId, o]));

  return (
    <>
      <PageHeader
        title="Pipeline"
        description={`${pipeline.name} · drag-and-drop is wired to GHL opportunity stages in a live deployment.`}
      />

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.pipelineStageId === stage.id);
          const value = stageLeads.reduce((sum, l) => sum + (oppByLead.get(l.id)?.monetaryValue ?? 0), 0);
          return (
            <div key={stage.id} className="flex w-64 shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{stage.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {stageLeads.length} · {formatCurrency(value)}
                  </p>
                </div>
                {stage.isWon && <span className="text-xs text-emerald-400">Won</span>}
                {stage.isLost && <span className="text-xs text-slate-500">Lost</span>}
              </div>
              <div className="flex-1 space-y-2 p-2">
                {stageLeads.map((lead) => {
                  const c = contactById.get(lead.contactId);
                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block rounded-lg border border-white/10 bg-navy-elevated p-2.5 hover:border-brand-blue/40"
                    >
                      <p className="text-sm font-medium text-white">
                        {c?.firstName} {c?.lastName}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <ScoreBadge score={lead.score} band={lead.scoreBand} />
                        <span className="text-[10px] text-slate-500">
                          {formatCurrency(oppByLead.get(lead.id)?.monetaryValue ?? 0)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {stageLeads.length === 0 && (
                  <p className="px-1 py-4 text-center text-[11px] text-slate-600">No leads</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
