import { BookedConfirmation } from '@/components/scorecard/booked-confirmation';

/**
 * Post-booking confirmation page. A scheduling provider can be configured to
 * redirect here after a booking (?submissionId=...), or the results page links
 * here for manual confirmation. It records a "Discovery Booked" intent event.
 */
export default async function BookedPage({
  searchParams,
}: {
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const { submissionId } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <BookedConfirmation submissionId={submissionId} />
    </div>
  );
}
