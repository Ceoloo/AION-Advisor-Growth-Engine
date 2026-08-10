import { BookingWidget } from '@/components/scheduling/booking-widget';

/** Public booking page for a calendar's shareable link (round-robin/collective/individual). */
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <BookingWidget slug={slug} />
    </div>
  );
}
