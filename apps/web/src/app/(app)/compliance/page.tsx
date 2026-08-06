import { Card, Badge, ComplianceAlert } from '@aion/ui';
import { DISCLOSURES } from '@aion/compliance';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';

export default function CompliancePage() {
  const org = getActiveOrg();
  const consents = org.consents;
  const granted = consents.filter((c) => c.status === 'granted').length;

  // A small synthetic audit trail from the timeline for demonstration.
  const audit = org.timeline.slice(0, 12);

  return (
    <>
      <PageHeader
        title="Compliance"
        description="Consent, audit trail, and disclosures. Technical controls only — not a statement of legal compliance."
      />

      <ComplianceAlert>
        This platform provides technical controls to support HIPAA/GLBA/FINRA/TCPA/CAN-SPAM alignment.
        Legal and compliance review is required before production deployment.
      </ComplianceAlert>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Consent Overview</h3>
          <p className="text-3xl font-semibold text-white">
            {granted}
            <span className="text-base text-slate-500">/{consents.length}</span>
          </p>
          <p className="text-xs text-slate-500">SMS consents granted across leads</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Audit Trail (recent)</h3>
          <ul className="space-y-2">
            {audit.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{e.label}</span>
                <Badge tone={e.actorType === 'ai' ? 'blue' : e.actorType === 'automation' ? 'amber' : 'neutral'}>
                  {e.actorType}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Standard Disclosures</h3>
        <div className="space-y-3">
          {Object.entries(DISCLOSURES).map(([key, text]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {key.replace(/([A-Z])/g, ' $1')}
              </p>
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Placeholder copy — replace with counsel-approved language before production.
        </p>
      </Card>
    </>
  );
}
