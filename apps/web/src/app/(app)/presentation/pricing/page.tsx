import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { PRICING } from '@/lib/presentation';
import { formatCurrency } from '@/lib/format';

export default function PricingPage() {
  return (
    <>
      <PageHeader
        title="Pilot Pricing"
        description="Internal reference. The pilot is a customized deployment of an already-built, tested operating system — not a one-off funnel."
        actions={
          <Link href="/presentation" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
            ← Back to hub
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {PRICING.map((tier) => (
          <Card
            key={tier.key}
            className={tier.recommended ? 'border-brand-blue/40 p-6' : 'p-6'}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              {tier.recommended && <Badge tone="blue">Recommended pilot</Badge>}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold text-white">{formatCurrency(tier.setup)}</span>
              <span className="pb-1 text-sm text-slate-400">setup</span>
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-2xl font-semibold text-brand-green">{formatCurrency(tier.monthly)}</span>
              <span className="pb-1 text-sm text-slate-400">/ month</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{tier.tagline}</p>
            <ul className="mt-4 space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-brand-green">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">Positioning</h3>
        <p className="text-sm text-slate-400">
          “Ben, the core system is already built and tested. What I’m proposing is a customized pilot
          configured around your audience, compliance requirements, calendar, follow-up process, and
          approved messaging.” The offer includes infrastructure, workflows, intelligence, reporting,
          support, and future integration capability — not just a page and some automations.
        </p>
      </Card>
    </>
  );
}
