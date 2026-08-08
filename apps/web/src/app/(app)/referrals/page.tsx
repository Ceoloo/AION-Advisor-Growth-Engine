import { Card, Badge, KpiCard } from '@aion/ui';
import { PageHeader } from '@/components/page-header';

// The Referral workflow (packages/workflows) drives these. Seeded sample data
// illustrates the tracking + reward loop.
const SAMPLE = [
  { id: 'r1', referrer: 'James Smith', referred: 'Dana Prince', status: 'converted', reward: true },
  { id: 'r2', referrer: 'Mary Johnson', referred: 'Chris Lane', status: 'contacted', reward: false },
  { id: 'r3', referrer: 'Robert Williams', referred: 'Sam Fox', status: 'new', reward: false },
];

const TONE: Record<string, 'neutral' | 'blue' | 'green'> = {
  new: 'neutral',
  contacted: 'blue',
  converted: 'green',
};

export default function ReferralsPage() {
  const converted = SAMPLE.filter((r) => r.status === 'converted').length;

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Milestone-driven referral requests, tracking, and rewards."
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + Add referral
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Referrals" value={SAMPLE.length} />
        <KpiCard label="Converted" value={converted} deltaTone="up" />
        <KpiCard label="Rewards issued" value={SAMPLE.filter((r) => r.reward).length} />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Referrer</th>
              <th className="px-4 py-3 font-medium">Referred</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reward</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-slate-300">{r.referrer}</td>
                <td className="px-4 py-3 text-slate-300">{r.referred}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[r.status] ?? 'neutral'}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3">{r.reward ? '✅' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
