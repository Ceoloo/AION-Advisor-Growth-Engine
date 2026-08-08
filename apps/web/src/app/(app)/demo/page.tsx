import Link from 'next/link';
import { Card, Badge, ComplianceAlert } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { dashboardMetricsForOrg } from '@/lib/metrics';

const PERSONAS = [
  {
    name: 'Financial Advisor',
    blurb: 'Works high-intent retirement and wealth leads. Uses AI briefings before every call.',
    start: '/leads',
  },
  {
    name: 'Health Insurance Agent',
    blurb: 'Qualifies ACA/Medicare eligibility, presents plans, and tracks applications.',
    start: '/qualify?vertical=health_insurance',
  },
  {
    name: 'Agency Administrator',
    blurb: 'Oversees the whole funnel, pipeline health, advisor performance, and compliance.',
    start: '/dashboard',
  },
];

const STEPS = [
  { n: 1, title: 'Capture', text: 'A prospect enters via form, chatbot, ad, referral, or webinar and lands as a lead.', href: '/leads' },
  { n: 2, title: 'Qualify', text: 'Complete an industry-specific qualification form; the AI gateway summarizes needs.', href: '/qualify' },
  { n: 3, title: 'Score', text: 'A deterministic, configurable engine scores intent, urgency, fit, and readiness.', href: '/leads' },
  { n: 4, title: 'Route & book', text: 'Qualified leads flow into the right pipeline stage and book an appointment.', href: '/pipeline' },
  { n: 5, title: 'Prepare', text: 'Advisors get an AI call-prep brief and recommended next action.', href: '/leads' },
  { n: 6, title: 'Convert & retain', text: 'Applications, policies, renewals, and referrals close the loop.', href: '/clients' },
];

export default function DemoPage() {
  const org = getActiveOrg();
  const m = dashboardMetricsForOrg(org);

  return (
    <>
      <PageHeader
        title="Guided Demo"
        description="A polished, end-to-end walkthrough of the lead journey on seeded data."
        actions={<Badge tone="gold">Demo mode</Badge>}
      />

      <ComplianceAlert>
        Everything here runs on seeded demo data. Outbound and destructive actions are disabled.
      </ComplianceAlert>

      {/* Personas */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {PERSONAS.map((p) => (
          <Card key={p.name} className="flex flex-col p-5">
            <p className="text-sm font-semibold text-white">{p.name}</p>
            <p className="mt-1 flex-1 text-xs text-slate-400">{p.blurb}</p>
            <Link
              href={p.start}
              className="mt-3 inline-flex w-fit rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-bright"
            >
              Start as {p.name} →
            </Link>
          </Card>
        ))}
      </div>

      {/* Journey */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-200">The lead journey</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <Link key={s.n} href={s.href}>
            <Card className="h-full p-5 transition-colors hover:border-brand-blue/40">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-blue/20 text-sm font-semibold text-blue-200">
                  {s.n}
                </span>
                <p className="text-sm font-semibold text-white">{s.title}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">{s.text}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Snapshot */}
      <Card className="mt-6 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Seeded snapshot</h3>
        <p className="text-sm text-slate-400">
          This demo tenant contains <strong className="text-white">{m.totalLeads}</strong> leads,{' '}
          <strong className="text-white">{m.appointmentsBooked}</strong> appointments,{' '}
          <strong className="text-white">{m.applicationsSubmitted}</strong> submitted applications, and{' '}
          <strong className="text-white">{m.policiesIssued}</strong> active policies — plus a second tenant
          used to prove data isolation.
        </p>
      </Card>
    </>
  );
}
