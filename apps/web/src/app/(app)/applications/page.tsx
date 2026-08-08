import Link from 'next/link';
import { Card, Badge, KpiCard } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatDate } from '@/lib/format';

const STATUS_TONE: Record<string, 'neutral' | 'blue' | 'green' | 'amber' | 'red'> = {
  not_started: 'neutral',
  started: 'blue',
  documents_pending: 'amber',
  submitted: 'blue',
  carrier_review: 'amber',
  approved: 'green',
  declined: 'red',
  withdrawn: 'neutral',
};

export default function ApplicationsPage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));
  const leadContact = (leadId: string) => {
    const lead = org.leads.find((l) => l.id === leadId);
    return lead ? contactById.get(lead.contactId) : null;
  };

  const submitted = org.applications.filter((a) =>
    ['submitted', 'carrier_review', 'approved'].includes(a.status),
  ).length;

  return (
    <>
      <PageHeader title="Applications" description="Application progress and carrier status." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Total" value={org.applications.length} />
        <KpiCard label="Submitted" value={submitted} deltaTone="up" />
        <KpiCard
          label="Docs pending"
          value={org.applications.filter((a) => a.status === 'documents_pending').length}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {org.applications.map((a) => {
                const c = leadContact(a.leadId);
                return (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${a.leadId}`} className="font-medium text-white hover:text-blue-300">
                        {c?.firstName} {c?.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.productType}</td>
                    <td className="px-4 py-3 text-slate-400">{a.carrier}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[a.status] ?? 'neutral'}>{a.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {a.submittedAt ? formatDate(a.submittedAt) : '—'}
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
