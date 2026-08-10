import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { getCapabilities } from '@aion/shared';
import { getActiveClient } from '@aion/clients';
import { evaluateLiveCampaignGate } from '@aion/compliance';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  const org = getActiveOrg();
  const gate = evaluateLiveCampaignGate(getActiveClient().launchApprovals ?? {}, getCapabilities());

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Acquisition sources and spend. Cost-per-lead is derived from live attribution."
        actions={
          gate.allowed ? (
            <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
              + Launch live campaign
            </button>
          ) : (
            <Link
              href="/launch"
              title={gate.reasons.join(' ')}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/15"
            >
              ⛔ Live campaigns blocked — review launch readiness
            </Link>
          )
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
