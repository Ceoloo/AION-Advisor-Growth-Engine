import { Card, Badge, EmptyState } from '@aion/ui';
import { PageHeader } from '@/components/page-header';

// Document collection is request-driven. The skeleton shows the request cards
// pattern; live deployments store files in Supabase Storage / S3 with signed URLs.
const SAMPLE_REQUESTS = [
  { id: 'dr1', name: 'Government ID', lead: 'James Smith', status: 'requested' },
  { id: 'dr2', name: 'Proof of income', lead: 'Mary Johnson', status: 'received' },
  { id: 'dr3', name: 'Current policy declarations', lead: 'Robert Williams', status: 'requested' },
  { id: 'dr4', name: 'Voided check (EFT)', lead: 'Patricia Brown', status: 'received' },
];

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Secure, request-driven document collection. Files use signed URLs and access logging."
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + Request document
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_REQUESTS.map((d) => (
          <Card key={d.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-white">{d.name}</p>
              <p className="text-xs text-slate-500">{d.lead}</p>
            </div>
            <Badge tone={d.status === 'received' ? 'green' : 'amber'}>{d.status}</Badge>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <EmptyState
          title="Storage not configured"
          description="Connect Supabase Storage or an S3-compatible bucket to upload and serve documents with signed URLs. See docs/security.md."
        />
      </div>
    </>
  );
}
