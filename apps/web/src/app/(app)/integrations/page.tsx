import { Card, Badge } from '@aion/ui';
import { listAdapters } from '@aion/integrations';
import { PageHeader } from '@/components/page-header';

export default async function IntegrationsPage() {
  const adapters = listAdapters();
  const health = await Promise.all(adapters.map((a) => a.healthCheck()));
  const byProvider = new Map(health.map((h) => [h.provider, h]));

  return (
    <>
      <PageHeader
        title="Integrations"
        description="GoHighLevel is implemented first. Every other provider ships as a typed interface with a mocked adapter."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adapters.map((a) => {
          const h = byProvider.get(a.provider)!;
          return (
            <Card key={a.provider} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize text-white">
                  {a.provider.replace(/_/g, ' ')}
                </p>
                {a.implemented ? (
                  <Badge tone="green">connected</Badge>
                ) : (
                  <Badge tone="neutral">not configured</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.capabilities.map((c) => (
                  <span key={c} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{h.message}</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
