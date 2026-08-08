import Link from 'next/link';
import { Card, Badge, ScoreBadge, ComplianceAlert } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg, getLeadDetail } from '@/lib/demo';
import { JOURNEY, MARCUS_LEAD_ID, MARCUS_TAGS } from '@/lib/presentation';

const ACTOR_TONE: Record<string, 'blue' | 'green' | 'amber' | 'gold' | 'neutral'> = {
  prospect: 'blue',
  system: 'neutral',
  automation: 'amber',
  ai: 'green',
  advisor: 'gold',
};

export default function PresentationPage() {
  const org = getActiveOrg();
  const marcus = getLeadDetail(MARCUS_LEAD_ID);

  return (
    <>
      <PageHeader
        title="Pilot Presentation"
        description={`${org.organization.name} — the Marcus Johnson journey, end to end in under five minutes.`}
        actions={
          <Link
            href="/presentation/stage/1"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright"
          >
            ▶ Start walkthrough
          </Link>
        }
      />

      <ComplianceAlert>
        Demo mode — seeded data, external sending disabled. No live GoHighLevel, AI, messaging, or
        production auth is connected until the pilot is approved.
      </ComplianceAlert>

      {/* Subject snapshot */}
      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Marcus Johnson</p>
            <p className="text-xs text-slate-400">
              54 · primary earner, family of four · Financial Protection Checkup lead
            </p>
          </div>
          {marcus && <ScoreBadge score={marcus.lead.score} band={marcus.lead.scoreBand} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {MARCUS_TAGS.map((t) => (
            <Badge key={t} tone="blue">
              {t}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 12 stage buttons */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-200">Open each stage in sequence</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {JOURNEY.map((stage) => (
          <Link key={stage.step} href={`/presentation/stage/${stage.step}`}>
            <Card className="flex h-full flex-col p-4 transition-colors hover:border-brand-blue/40">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-blue/20 text-sm font-semibold text-blue-200">
                  {stage.step}
                </span>
                <p className="text-sm font-semibold text-white">{stage.title}</p>
              </div>
              <p className="mt-2 flex-1 text-xs text-slate-400">{stage.subtitle}</p>
              <div className="mt-2">
                <Badge tone={ACTOR_TONE[stage.actor] ?? 'neutral'}>{stage.actor}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Operator links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/presentation/pricing">
          <Card className="p-4 transition-colors hover:border-brand-blue/40">
            <p className="text-sm font-semibold text-white">💰 Pricing</p>
            <p className="mt-1 text-xs text-slate-400">Pilot & Growth System (internal)</p>
          </Card>
        </Link>
        <Link href="/presentation/checklist">
          <Card className="p-4 transition-colors hover:border-brand-blue/40">
            <p className="text-sm font-semibold text-white">✅ Approval Checklist</p>
            <p className="mt-1 text-xs text-slate-400">9 pre-launch sign-offs</p>
          </Card>
        </Link>
        <Link href="/demo-control">
          <Card className="p-4 transition-colors hover:border-brand-blue/40">
            <p className="text-sm font-semibold text-white">🎛️ Demo Control</p>
            <p className="mt-1 text-xs text-slate-400">Reset, seed, sending, restore</p>
          </Card>
        </Link>
      </div>
    </>
  );
}
