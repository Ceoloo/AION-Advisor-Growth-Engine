/**
 * Centralized intent-scoring configuration. Scorecard completion is a genuine
 * intent signal and is kept DISTINCT from firmographic/ICP fit — completing the
 * scorecard adds intent points, but does not by itself mark a lead as
 * high buying intent (see docs/scorecard.md).
 */
export type IntentEventType = 'Scorecard Completed' | 'Booking Page Viewed' | 'Discovery Booked';

export const INTENT_POINTS: Record<IntentEventType, number> = {
  'Scorecard Completed': 15,
  'Booking Page Viewed': 25,
  'Discovery Booked': 50,
};

/** Client-side analytics event names (the reusable tracking layer). */
export const TRACKING_EVENTS = [
  'advisor_scorecard_started',
  'advisor_scorecard_question_answered',
  'advisor_scorecard_completed',
  'advisor_scorecard_results_viewed',
  'advisor_scorecard_booking_clicked',
  'advisor_scorecard_report_saved',
] as const;
export type TrackingEvent = (typeof TRACKING_EVENTS)[number];

/** Which analytics events are persisted as CRM Intent & Attribution Events. */
export const EVENT_TO_INTENT: Partial<Record<TrackingEvent, IntentEventType>> = {
  advisor_scorecard_completed: 'Scorecard Completed',
  advisor_scorecard_booking_clicked: 'Booking Page Viewed',
};

export function intentPointsFor(type: IntentEventType): number {
  return INTENT_POINTS[type] ?? 0;
}
