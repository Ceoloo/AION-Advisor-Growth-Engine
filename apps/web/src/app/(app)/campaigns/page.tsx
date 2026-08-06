import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatCurrency } from '@/lib/format';

export default function CampaignsPage() {
  const org = getActiveOrg();

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Acquisition sources and spend. Cost-per-lead is derived from live attribution."
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + New campaign
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {org.campaigns.map((c) => {
          const cpl = c.leadsGenerated ? c.spend / c.leadsGenerated : 0;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <Badge tone="blue">{c.channel.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-slate-500">Spend</p>
                  <p className="text-sm font-medium text-slate-200">{formatCurrency(c.spend)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Leads</p>
                  <p className="text-sm font-medium text-slate-200">{c.leadsGenerated}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CPL</p>
                  <p className="text-sm font-medium text-slate-200">{formatCurrency(cpl)}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
