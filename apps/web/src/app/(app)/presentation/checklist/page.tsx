import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { ApprovalChecklist } from '@/components/approval-checklist';

export default function ChecklistPage() {
  return (
    <>
      <PageHeader
        title="Pre-Launch Approval Checklist"
        description="Every item must be signed off by Ben before any live sending or production connection is enabled."
        actions={
          <Link href="/presentation" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
            ← Back to hub
          </Link>
        }
      />
      <ApprovalChecklist />
    </>
  );
}
