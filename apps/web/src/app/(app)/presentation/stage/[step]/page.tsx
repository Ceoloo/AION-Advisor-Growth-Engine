import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Badge, ScoreBadge, ComplianceAlert } from '@aion/ui';
import { getActiveOrg, getLeadDetail } from '@/lib/demo';
import { dashboardMetricsForOrg } from '@/lib/metrics';
import { AiBriefing } from '@/components/ai-briefing';
import { formatCurrency, formatDateTime, percent } from '@/lib/format';
import {
  JOURNEY,
  TOTAL_STAGES,
  EDUCATION_CARDS,
  FOLLOW_UP_DRAFTS,
  MARCUS_LEAD_ID,
  MARCUS_TAGS,
  CLOSING_QUESTION,
} from '@/lib/presentation';
import type { ScoreCategory } from '@aion/types';

export default async function StagePage({ params }: { params: Promise<{ step: string }> }) {
  const { step: stepStr } = await params;
  const step = Number(stepStr);
  const stage = JOURNEY.find((s) => s.step === step);
  if (!stage || Number.isNaN(step)) notFound();

  const detail = getLeadDetail(MARCUS_LEAD_ID)!;
  const prev = step > 1 ? step - 1 : null;
  const next = step < TOTAL_STAGES ? step + 1 : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/presentation" className="text-xs text-slate-500 hover:text-slate-300">
          ← Hub
        </Link>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: `${(step / TOTAL_STAGES) * 100}%` }} />
          </div>
        </div>
        <span className="text-xs text-slate-500">
          Stage {step} / {TOTAL_STAGES}
        </span>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue/20 text-sm font-semibold text-blue-200">
          {step}
        </span>
        <h1 className="text-xl font-semibold text-white">{stage.title}</h1>
      </div>
      <p className="mb-4 text-sm text-slate-400">{stage.narration}</p>

      <div className="space-y-4">{renderStage(step, detail)}</div>

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between gap-2">
        {prev ? (
          <Link
            href={`/presentation/stage/${prev}`}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {stage.liveHref && (
            <Link
              href={stage.liveHref}
              className="rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-4 py-2 text-sm text-blue-200 hover:bg-brand-blue/20"
            >
              {stage.liveLabel ?? 'Open live screen'} ↗
            </Link>
          )}
          {next ? (
            <Link
              href={`/presentation/stage/${next}`}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright"
            >
              Next →
            </Link>
          ) : (
            <Link
              href="/presentation/pricing"
              className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Review pilot pricing →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

type Detail = NonNullable<ReturnType<typeof getLeadDetail>>;

function renderStage(step: number, detail: Detail) {
  const { lead, contact, score, qualification, appointments, consents } = detail;

  switch (step) {
    case 1:
      return (
        <Card className="p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
            Ben Peretz — Financial Protection & Planning
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Financial Protection Checkup</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            A 2-minute checkup to see how well your family’s income and legacy are protected — and
            what to prioritize next.
          </p>
          <span className="mt-4 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white">
            Start my checkup →
          </span>
          <p className="mt-3 text-[11px] text-slate-500">Educational only. Not investment or insurance advice.</p>
        </Card>
      );

    case 2:
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Contact captured</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Field label="Name" value={`${contact?.firstName} ${contact?.lastName}`} />
            <Field label="Email" value={contact?.email ?? '—'} />
            <Field label="Phone" value={contact?.phone ?? '—'} />
            <Field label="State" value={contact?.state ?? '—'} />
          </dl>
          <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-200">Consent captured</h3>
          <div className="flex flex-wrap gap-2">
            {consents.map((c) => (
              <Badge key={c.id} tone="green">
                {c.type.toUpperCase()} · {c.status}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Captured via the checkup. Nothing is sent without granted, unexpired consent.
          </p>
        </Card>
      );

    case 3:
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Completed qualification answers</h3>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {Object.entries(qualification?.answers ?? {}).map(([k, v]) => (
              <Field key={k} label={k.replace(/_/g, ' ')} value={formatAnswer(v)} />
            ))}
          </dl>
        </Card>
      );

    case 4: {
      const breakdown = (score?.breakdown ?? {}) as Record<ScoreCategory, number>;
      return (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Deterministic score</h3>
            <ScoreBadge score={lead.score} band={lead.scoreBand} />
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Computed by the same rule-based engine as every lead — reproducible and explainable.
          </p>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {(Object.entries(breakdown) as [ScoreCategory, number][]).map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-40 shrink-0 text-xs capitalize text-slate-400">{cat.replace(/_/g, ' ')}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-brand-blue" style={{ width: `${val}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-slate-400">{Math.round(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    case 5:
      return (
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">High-priority classification</h3>
          <div className="flex items-center gap-3">
            <ScoreBadge score={lead.score} band={lead.scoreBand} />
            <span className="text-sm text-slate-400">Routed for immediate, personal follow-up by Ben.</span>
          </div>
          <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-200">Tags applied</h3>
          <div className="flex flex-wrap gap-2">
            {MARCUS_TAGS.map((t) => (
              <Badge key={t} tone="blue">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      );

    case 6:
      return (
        <>
          {EDUCATION_CARDS.map((c) => (
            <Card key={c.title} className="p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                <Badge tone="green">{c.tag}</Badge>
              </div>
              <p className="text-sm text-slate-400">{c.body}</p>
            </Card>
          ))}
          <ComplianceAlert>Educational content only — not a recommendation or advice.</ComplianceAlert>
        </>
      );

    case 7:
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">CRM lead created</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Field label="Lead" value={`${contact?.firstName} ${contact?.lastName}`} />
            <Field label="Assigned advisor" value={detail.advisor?.fullName ?? '—'} />
            <Field label="Status" value={lead.status.replace(/_/g, ' ')} />
            <Field label="Source" value={lead.source?.replace(/_/g, ' ') ?? '—'} />
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">
            In production this upserts a contact + opportunity into GoHighLevel via @aion/ghl.
          </p>
        </Card>
      );

    case 8: {
      const org = getActiveOrg();
      const stageName = org.stages.find((s) => s.id === lead.pipelineStageId)?.name ?? '—';
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Pipeline movement</h3>
          <div className="flex items-center gap-2 text-sm">
            <Badge tone="neutral">New Lead</Badge>
            <span className="text-slate-500">→</span>
            <Badge tone="neutral">Qualified</Badge>
            <span className="text-slate-500">→</span>
            <Badge tone="green">{stageName}</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Marcus now sits in the “{stageName}” stage of the Financial Advisor pipeline.
          </p>
        </Card>
      );
    }

    case 9:
      return (
        <>
          <ComplianceAlert>
            External sending is disabled in demo mode — these drafts are simulated and never leave the
            system.
          </ComplianceAlert>
          {FOLLOW_UP_DRAFTS.map((f, i) => (
            <Card key={i} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <Badge tone="amber">{f.channel}</Badge>
                <span className="text-[11px] text-slate-500">{f.when}</span>
              </div>
              <p className="text-sm text-slate-300">{f.body}</p>
              <p className="mt-1 text-[11px] text-slate-500">Simulated — not sent.</p>
            </Card>
          ))}
        </>
      );

    case 10: {
      const appt = appointments[0];
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Appointment booked</h3>
          {appt ? (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Field label="Title" value={appt.title} />
              <Field label="When" value={formatDateTime(appt.startsAt)} />
              <Field label="Advisor" value={detail.advisor?.fullName ?? '—'} />
              <Field label="Status" value={appt.status} />
            </dl>
          ) : (
            <p className="text-sm text-slate-400">No appointment.</p>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            In production this books on the connected calendar and sends confirmations.
          </p>
        </Card>
      );
    }

    case 11:
      return <AiBriefing leadId={lead.id} />;

    case 12: {
      const org = getActiveOrg();
      const m = dashboardMetricsForOrg(org);
      const kpis: [string, string | number][] = [
        ['Total leads', m.totalLeads],
        ['Qualified', m.qualifiedLeads],
        ['High-priority', m.highPriorityLeads],
        ['Appointments', m.appointmentsBooked],
        ['Pipeline value', formatCurrency(m.estimatedPipelineValue)],
        ['Lead → appt', percent(m.leadToAppointmentRate)],
      ];
      return (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Dashboard metrics updated</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kpis.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-0.5 text-lg font-semibold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Marcus’ journey moved every one of these — capture, qualification, priority, and a booked
            appointment.
          </p>
          <div className="mt-4 rounded-lg border border-brand-green/30 bg-brand-green/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">The ask</p>
            <p className="mt-1 text-base font-semibold text-white">{CLOSING_QUESTION}</p>
          </div>
        </Card>
      );
    }

    default:
      return null;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm capitalize text-slate-200">{value}</dd>
    </div>
  );
}

function formatAnswer(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}
