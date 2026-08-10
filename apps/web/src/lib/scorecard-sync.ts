/**
 * Server-side orchestration for a scorecard submission. Runs ONLY on the server
 * (imports the Airtable client, which reads the secret token). It:
 *   1. generates the internal Advisor Brief (deterministic; logged, never auto-sent),
 *   2. in demo mode or when Airtable is unconfigured, writes nothing,
 *   3. otherwise upserts the Lead (email dedupe, preserves existing data),
 *      creates the Scorecard Response (idempotent by Response ID), and records a
 *      "Scorecard Completed" Intent event.
 * All Airtable work is best-effort — failures never block the visitor's report.
 */
import { getCapabilities, isDemoMode, logger } from '@aion/shared';
import { createAirtableClient } from '@aion/integrations';
import { recordOps } from '@/lib/observability';
import {
  generateAdvisorBrief,
  renderAdvisorBriefText,
  INTENT_POINTS,
  type ScorecardResult,
  type Submission,
} from '@aion/scorecard';

export interface SyncResult {
  demo: boolean;
  wrote: boolean;
  leadId?: string;
  responseDeduped?: boolean;
  error?: string;
}

// Process-local guard so rapid retries don't re-hit Airtable (Airtable itself is
// also idempotent by Response ID / Event ID / email).
const syncedSubmissions = new Set<string>();

export function buildSourceUtm(attr?: Submission['attribution']): string {
  if (!attr) return '';
  const parts = [
    attr.source && `source=${attr.source}`,
    attr.campaign && `campaign=${attr.campaign}`,
    attr.utm?.utm_source && `utm_source=${attr.utm.utm_source}`,
    attr.utm?.utm_medium && `utm_medium=${attr.utm.utm_medium}`,
    attr.utm?.utm_campaign && `utm_campaign=${attr.utm.utm_campaign}`,
    attr.utm?.utm_term && `utm_term=${attr.utm.utm_term}`,
    attr.utm?.utm_content && `utm_content=${attr.utm.utm_content}`,
  ].filter(Boolean);
  return parts.join('&');
}

export async function syncScorecardSubmission(
  submission: Submission,
  result: ScorecardResult,
): Promise<SyncResult> {
  const caps = getCapabilities();
  const log = logger.child({ component: 'scorecard-sync', submissionId: submission.submissionId });

  // Internal Advisor Brief — deterministic; logged for internal use and
  // delivered to the CRM response record (not sent externally).
  const brief = generateAdvisorBrief(submission.contact, result, submission.attribution);
  const briefText = renderAdvisorBriefText(brief);
  log.info('advisor brief generated', { briefText });

  // Production CRM writes are gated by the resolved runtime mode, not a raw env
  // flag — demo never writes, and pilot/production only write once the gated
  // activation checks pass (see @aion/shared/mode).
  if (!caps.allowProductionCrmWrites) {
    log.info('crm writes disabled for current mode — no production records written', {
      mode: caps.mode,
    });
    recordOps({
      component: 'airtable',
      type: 'crm_sync',
      status: 'suppressed',
      retryCount: 0,
      message: `CRM sync suppressed — writes disabled in ${caps.mode} mode`,
      correlationId: submission.submissionId,
    });
    return { demo: isDemoMode(), wrote: false };
  }

  const client = createAirtableClient(log);
  if (!client) {
    log.warn('airtable not configured — skipping writes');
    return { demo: false, wrote: false };
  }

  if (syncedSubmissions.has(submission.submissionId)) {
    return { demo: false, wrote: true, responseDeduped: true };
  }

  const c = submission.contact;
  const sourceUtm = buildSourceUtm(submission.attribution);
  const sectionScores = Object.fromEntries(result.sections.map((s) => [s.id, s.earned])) as Record<
    'acquisition' | 'speed_to_lead' | 'qualification' | 'follow_up' | 'booking' | 'crm',
    number
  >;
  const topFindings = result.findings
    .map((f) => `• ${f.prompt}\n  ${f.observedGap} ${f.implication}`)
    .join('\n\n');

  try {
    const lead = await client.upsertLead({
      fullName: c.fullName,
      email: c.email,
      phone: c.phone || undefined,
      company: c.company,
      role: c.role || undefined,
      formSourceUrl: submission.attribution?.landingPath || undefined,
      summary: `Advisor Conversion Scorecard: ${result.total}/100 (${result.band}). Primary leak: ${result.primaryLeak.label}.`,
    });

    const response = await client.createScorecardResponse(
      {
        responseId: submission.submissionId,
        fullName: c.fullName,
        company: c.company,
        email: c.email,
        phone: c.phone || undefined,
        role: c.role || undefined,
        monthlyLeadVolume: c.monthlyLeadVolume,
        primaryLeadSources: c.primaryLeadSources || undefined,
        currentCrm: c.currentCrm || undefined,
        sectionScores,
        primaryLeak: result.primaryLeak.label,
        topFindings,
        firstFix: result.recommendedFirstFix,
        resultSummary: `${result.total}/100 — ${result.band}. First fix: ${result.recommendedFirstFix}`,
        growthPriority: c.growthPriority,
        interestedInReview: false,
        consent: c.consentToFollowUp,
        sourceUtm,
        // Deliver the internal Advisor Brief into the CRM record for the rep.
        rawAnswers: `ADVISOR BRIEF\n${briefText}\n\nRAW\n${JSON.stringify({
          answers: submission.answers,
          attribution: submission.attribution,
        })}`,
      },
      lead.id,
    );

    // Scorecard completion is a genuine intent signal — kept DISTINCT from ICP fit.
    await client.createIntentEvent(
      {
        eventId: `${submission.submissionId}:scorecard_completed`,
        eventType: 'Scorecard Completed',
        intentPoints: INTENT_POINTS['Scorecard Completed'],
        channel: 'Scorecard',
        sourceUtm,
        content: `Score ${result.total} — primary leak: ${result.primaryLeak.label}`,
        evidence: 'Completed the Advisor Conversion Scorecard',
        verified: true,
      },
      lead.id,
    );

    syncedSubmissions.add(submission.submissionId);
    log.info('airtable sync complete', {
      leadId: lead.id,
      leadCreated: lead.created,
      responseDeduped: response.deduped,
    });
    recordOps({
      component: 'airtable',
      type: 'crm_sync',
      status: 'success',
      retryCount: 1,
      message: 'Scorecard lead + response synced to CRM',
      correlationId: submission.submissionId,
    });
    return { demo: false, wrote: true, leadId: lead.id, responseDeduped: response.deduped };
  } catch (err) {
    log.error('airtable sync failed (non-blocking)', {
      error: err instanceof Error ? err.message : String(err),
    });
    recordOps({
      component: 'airtable',
      type: 'crm_sync',
      status: 'failure',
      retryCount: 1,
      message: 'Scorecard CRM sync failed',
      error: err instanceof Error ? err.message : String(err),
      correlationId: submission.submissionId,
    });
    return { demo: false, wrote: false, error: 'sync_failed' };
  }
}
