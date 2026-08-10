/**
 * Representative demo telemetry so the System Health board is alive on a fresh
 * process — a healthy system with real structure: successful workflow runs, a
 * processed webhook, an AI call, a demo-suppressed outbound message, and a CRM
 * sync that failed once then recovered (to exercise retry counting) — all green.
 */
import type { OpsRecorder } from './recorder.js';

const minsAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();

export function seedDemoOps(recorder: OpsRecorder): void {
  recorder.record({
    component: 'workflows',
    type: 'workflow_execution',
    status: 'success',
    retryCount: 1,
    message: 'scorecard_nurture completed',
    correlationId: 'wf_nurture_001',
    at: minsAgo(42),
  });
  recorder.record({
    component: 'ghl',
    type: 'webhook',
    status: 'success',
    retryCount: 1,
    message: 'ContactCreate accepted (verified)',
    at: minsAgo(31),
  });
  recorder.record({
    component: 'ai',
    type: 'ai_call',
    status: 'success',
    retryCount: 1,
    message: 'Lead qualification (mock provider)',
    at: minsAgo(25),
  });
  recorder.record({
    component: 'scorecard',
    type: 'scorecard_submission',
    status: 'success',
    retryCount: 1,
    message: 'Scored 57 — Conversion Gaps',
    at: minsAgo(20),
  });
  // A CRM sync that failed once and then recovered — shows retry counting green.
  recorder.record({
    component: 'airtable',
    type: 'crm_sync',
    status: 'retry',
    retryCount: 1,
    message: 'Upsert lead',
    error: 'Transient 429 from Airtable',
    correlationId: 'sync_lead_88',
    at: minsAgo(15),
  });
  recorder.record({
    component: 'airtable',
    type: 'crm_sync',
    status: 'success',
    retryCount: 2,
    message: 'Upsert lead (recovered on retry)',
    correlationId: 'sync_lead_88',
    at: minsAgo(14),
  });
  recorder.record({
    component: 'booking',
    type: 'booking_event',
    status: 'success',
    retryCount: 1,
    message: 'Advisor Growth Review booked (round-robin: Dana Cohen)',
    at: minsAgo(9),
  });
  // Outbound is intentionally not sent in demo — recorded as suppressed, not a fault.
  recorder.record({
    component: 'ghl',
    type: 'outbound_message',
    status: 'suppressed',
    retryCount: 0,
    message: 'SMS suppressed — outbound disabled in demo mode',
    at: minsAgo(8),
  });
  recorder.record({
    component: 'analytics',
    type: 'analytics_compute',
    status: 'success',
    retryCount: 1,
    message: 'Funnel + baseline comparison computed',
    at: minsAgo(4),
  });
  recorder.record({
    component: 'compliance',
    type: 'compliance_check',
    status: 'success',
    retryCount: 1,
    message: 'Launch gate evaluated — eligible',
    at: minsAgo(2),
  });
}
