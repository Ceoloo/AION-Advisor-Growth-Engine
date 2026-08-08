import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';

export default function SettingsPage() {
  const org = getActiveOrg();
  const s = org.settings;
  const weights = Object.entries(s.scoringWeights);
  const bands = Object.entries(s.scoreBandThresholds).sort((a, b) => Number(a[1]) - Number(b[1]));

  return (
    <>
      <PageHeader title="Settings" description="Organization configuration, scoring weights, and feature flags." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Organization</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={org.organization.name} />
            <Row label="Slug" value={org.organization.slug} />
            <Row label="Type" value={org.organization.type.replace(/_/g, ' ')} />
            <Row label="Primary vertical" value={org.organization.primaryVertical.replace(/_/g, ' ')} />
            <Row label="Timezone" value={s.timezone} />
            <Row label="Demo mode" value={org.organization.isDemo ? 'Enabled' : 'Disabled'} />
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Feature Flags</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(s.featureFlags).map(([flag, on]) => (
              <Badge key={flag} tone={on ? 'green' : 'neutral'}>
                {flag}: {on ? 'on' : 'off'}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Scoring Weights</h3>
          <div className="space-y-1.5">
            {weights.map(([cat, w]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-400">{cat.replace(/_/g, ' ')}</span>
                <span className="tabular-nums text-slate-200">{Math.round(Number(w) * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Configurable per organization.</p>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Score Bands</h3>
          <div className="space-y-1.5">
            {bands.map(([band, min]) => (
              <div key={band} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-400">{band.replace(/_/g, ' ')}</span>
                <span className="tabular-nums text-slate-200">≥ {String(min)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="capitalize text-slate-200">{value}</dd>
    </div>
  );
}
