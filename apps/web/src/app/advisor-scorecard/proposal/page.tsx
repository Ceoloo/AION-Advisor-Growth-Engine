import { ProposalView } from '@/components/scorecard/proposal-view';

/**
 * Personalized growth plan / demo. Assembles the diagnosis, ROI business case,
 * and a recommended AION plan from the visitor's own result (persisted at
 * completion) or the deterministic sample (?sample=1) for presentations.
 */
export default async function ProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const { sample } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <ProposalView sampleMode={sample === '1' || sample === 'marcus'} />
    </div>
  );
}
