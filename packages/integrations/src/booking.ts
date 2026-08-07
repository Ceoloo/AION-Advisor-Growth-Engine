/**
 * Booking adapter. Provider-agnostic: the app is not coupled to any specific
 * scheduling tool. The Advisor Growth Review URL comes from configuration; when
 * unset, callers show a graceful "booking coming soon" state and still record
 * the booking-intent event.
 */
import { loadEnv } from '@aion/shared';

export interface BookingTarget {
  configured: boolean;
  url: string | null;
}

export function resolveAdvisorGrowthReviewBooking(): BookingTarget {
  const url = loadEnv().ADVISOR_GROWTH_REVIEW_URL?.trim();
  return { configured: !!url, url: url || null };
}
