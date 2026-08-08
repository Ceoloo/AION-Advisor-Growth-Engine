import { ScorecardExperience } from '@/components/scorecard/scorecard-experience';

// The public acquisition funnel. Server component shell → client experience.
// A ?sample=1 query loads the deterministic demo submission for presentations.
export default async function AdvisorScorecardPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const { sample } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <ScorecardExperience sampleMode={sample === '1' || sample === 'marcus'} />
    </div>
  );
}
