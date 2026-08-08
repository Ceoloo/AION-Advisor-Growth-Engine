import Link from 'next/link';
import { Card, ScoreBadge, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { relativeTime } from '@/lib/format';

const STATUS_TONE: Record<string, 'neutral' | 'blue' | 'green' | 'amber'> = {
  new: 'neutral',
  nurturing: 'amber',
  working: 'blue',
  qualified: 'green',
  appointment_set: 'green',
  client: 'green',
  lost: 'neutral',
};

export default function LeadsPage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));
  const advisorById = new Map(org.profiles.map((p) => [p.id, p]));
  const stageById = new Map(org.stages.map((s) => [s.id, s]));

  const leads = [...org.leads].sort((a, b) => b.score - a.score);

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads across all sources and verticals.`}
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + New lead
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Vertical</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Advisor</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Activity</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const c = contactById.get(lead.contactId);
                const advisor = lead.assignedAdvisorId ? advisorById.get(lead.assignedAdvisorId) : null;
                const stage = lead.pipelineStageId ? stageById.get(lead.pipelineStageId) : null;
                return (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-white hover:text-blue-300">
                        {c?.firstName} {c?.lastName}
                      </Link>
                      <p className="text-xs text-slate-500">{c?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} band={lead.scoreBand} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[lead.status] ?? 'neutral'}>{lead.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {lead.vertical === 'financial_advisor' ? 'Financial' : 'Health'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{stage?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{advisor?.fullName ?? 'Unassigned'}</td>
                    <td className="px-4 py-3 capitalize text-slate-400">{lead.source?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {lead.lastActivityAt ? relativeTime(lead.lastActivityAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
