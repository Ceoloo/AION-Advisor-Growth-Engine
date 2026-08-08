import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { DemoControl } from '@/components/demo-control';

export default function DemoControlPage() {
  return (
    <>
      <PageHeader
        title="Demo Control"
        description="Operator controls for the pilot presentation. Reset Marcus, seed him at any stage, toggle external sending, and restore the demo."
        actions={
          <Link href="/presentation" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
            ← Presentation
          </Link>
        }
      />
      <DemoControl />
    </>
  );
}
