import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import {
  getActiveClient,
  listClients,
  isClientLiveApproved,
  leadPool,
  type ClientConfig,
  type ClientApprovalStatus,
  type ClientComplianceStatus,
} from '@aion/clients';
import { PageHeader } from '@/components/page-header';

export const dynamic = 'force-dynamic';

const APPROVAL_TONE: Record<ClientApprovalStatus, 'green' | 'blue' | 'amber' | 'neutral' | 'red'> = {
  draft: 'neutral',
  pending_approval: 'amber',
  approved: 'blue',
  active: 'green',
  suspended: 'red',
};
const COMPLIANCE_TONE: Record<ClientComplianceStatus, 'green' | 'amber' | 'neutral' | 'red'> = {
  not_started: 'neutral',
  in_review: 'amber',
  changes_requested: 'red',
  approved: 'green',
};

const label = (s: string) => s.replace(/_/g, ' ');

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-200">{value}</p>
    </div>
  );
}

function ClientCard({ config, active }: { config: ClientConfig; active: boolean }) {
  const owner = leadPool(config);
  return (
    <Card className={`p-5 ${active ? 'border-brand-blue/50 bg-brand-blue/5' : ''}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{config.advisor.name}</h3>
            {config.isClientZero && <Badge tone="gold">Client Zero</Badge>}
            {active && <Badge tone="blue">Active</Badge>}
            {isClientLiveApproved(config) ? (
              <Badge tone="green">Live-approved</Badge>
            ) : (
              <Badge tone="amber">Onboarding</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">{config.advisor.title}</p>
        </div>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
          {label(config.vertical)}
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-400">{config.advisor.bio}</p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Client ID" value={<code className="text-slate-300">{config.clientId}</code>} />
        <Field label="Organization" value={<code className="text-slate-300">{config.organizationId}</code>} />
        <Field label="Service area" value={config.advisor.serviceArea} />
        <Field label="Licensed states" value={config.advisor.licensedStates.join(', ')} />
        <Field label="Primary audience" value={config.primaryAudience} />
        <Field label="Planning areas" value={config.planningAreas.join(' · ')} />
        <Field label="CRM provider" value={label(config.providers.crm)} />
        <Field label="Calendar" value={label(config.providers.calendar)} />
        <Field label="Lead sources" value={config.leadSources.join(', ')} />
        <Field label="Lead owner(s)" value={owner.map((m) => m.name).join(', ')} />
        <Field
          label="Approval"
          value={<Badge tone={APPROVAL_TONE[config.approval.status]}>{label(config.approval.status)}</Badge>}
        />
        <Field
          label="Compliance"
          value={
            <Badge tone={COMPLIANCE_TONE[config.compliance.status]}>{label(config.compliance.status)}</Badge>
          }
        />
      </div>

      {config.bookingUrl && (
        <p className="mt-4 truncate text-xs text-slate-500">
          Booking: <span className="text-slate-400">{config.bookingUrl}</span>
        </p>
      )}

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Follow-up cadence
        </p>
        <ul className="space-y-1">
          {config.followupCadence.map((step, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-14 text-slate-500">+{step.afterHours}h</span>
              <Badge tone="neutral">{step.channel}</Badge>
              <span>{step.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function ClientConfigPage() {
  const active = getActiveClient();
  const clients = listClients();

  return (
    <>
      <PageHeader
        title="Client Configuration"
        description="Every advisor is a ClientConfig on the same AION engine. Onboarding a new advisor is adding a config — not forking the product."
        actions={
          <Link
            href="/create-client"
            className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright"
          >
            + Create Client
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-white">{clients.length}</span> registered client
          {clients.length === 1 ? '' : 's'} · active:{' '}
          <span className="font-medium text-brand-blue">{active.advisor.name}</span>{' '}
          <span className="text-slate-500">({active.clientId})</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Selected via <code className="text-slate-400">AION_ACTIVE_CLIENT</code>. This is a read-only
          governance view — selection and go-live happen in the deployment environment.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {clients.map((c) => (
          <ClientCard key={c.clientId} config={c} active={c.clientId === active.clientId} />
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Ben → ClientConfig → AION Engine. Advisor #2 → ClientConfig → the same engine. That is the
        difference between a client project and an actual product.
      </p>
    </>
  );
}
