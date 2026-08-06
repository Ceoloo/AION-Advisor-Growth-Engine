import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ClientsPage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));

  // Clients = leads with an active policy.
  const clients = org.policies.map((p) => {
    const lead = org.leads.find((l) => l.id === p.leadId);
    const contact = lead ? contactById.get(lead.contactId) : null;
    return { policy: p, lead, contact };
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Active policyholders and their coverage. Renewals surface here for retention."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Premium</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(({ policy, lead, contact }) => (
                <tr key={policy.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    {lead ? (
                      <Link href={`/leads/${lead.id}`} className="font-medium text-white hover:text-blue-300">
                        {contact?.firstName} {contact?.lastName}
                      </Link>
                    ) : (
                      '—'
                    )}
                    <p className="text-xs text-slate-500">{policy.policyNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{policy.productType}</td>
                  <td className="px-4 py-3 text-slate-400">{policy.carrier}</td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(policy.premium)}/mo</td>
                  <td className="px-4 py-3">
                    <Badge tone="green">{policy.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {policy.renewalDate ? formatDate(policy.renewalDate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
