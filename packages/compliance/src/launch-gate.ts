/**
 * Launch gate — compliance as real application logic, not a checklist toggle.
 *
 * Live campaigns are permitted only when BOTH independent gates pass:
 *   1. every CRITICAL approval is complete (branding, biography, licensing,
 *      disclosure, messaging, data handling, CRM, calendar), and
 *   2. the resolved runtime mode grants the `allowLiveCampaigns` capability
 *      (see @aion/shared/mode — production only).
 *
 * Either gate failing ⇒ LIVE CAMPAIGN = BLOCKED. Enforcement lives in
 * `assertLiveCampaignAllowed`, which throws before any live-campaign action —
 * so it cannot be bypassed casually from the UI.
 */
import { AppError, type ModeCapabilities } from '@aion/shared';
import {
  LAUNCH_APPROVAL_ITEMS,
  type LaunchApprovalKey,
  type LaunchApprovalRecord,
  type LaunchApprovalState,
} from '@aion/types';

export interface LaunchApprovalItemStatus {
  key: LaunchApprovalKey;
  label: string;
  detail: string;
  critical: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface LaunchReadiness {
  items: LaunchApprovalItemStatus[];
  approvedCount: number;
  totalCritical: number;
  approvedCritical: number;
  /** Critical approvals still outstanding. */
  missingCritical: LaunchApprovalItemStatus[];
  /** True only when every critical approval is complete. */
  launchEligible: boolean;
}

const isApproved = (rec?: LaunchApprovalRecord): boolean => !!rec?.approved;

/**
 * Evaluate a client's launch readiness from its recorded approval state.
 * Pure and deterministic — the single source of truth for "LAUNCH ELIGIBLE".
 */
export function evaluateLaunchReadiness(state: LaunchApprovalState = {}): LaunchReadiness {
  const items: LaunchApprovalItemStatus[] = LAUNCH_APPROVAL_ITEMS.map((item) => {
    const rec = state[item.key];
    return {
      key: item.key,
      label: item.label,
      detail: item.detail,
      critical: item.critical,
      approved: isApproved(rec),
      approvedBy: rec?.approvedBy,
      approvedAt: rec?.approvedAt,
    };
  });

  const critical = items.filter((i) => i.critical);
  const approvedCritical = critical.filter((i) => i.approved);
  const missingCritical = critical.filter((i) => !i.approved);

  return {
    items,
    approvedCount: items.filter((i) => i.approved).length,
    totalCritical: critical.length,
    approvedCritical: approvedCritical.length,
    missingCritical,
    launchEligible: missingCritical.length === 0,
  };
}

/** Throw unless every critical approval is complete. */
export function assertLaunchEligible(state: LaunchApprovalState = {}): void {
  const readiness = evaluateLaunchReadiness(state);
  if (!readiness.launchEligible) {
    const missing = readiness.missingCritical.map((i) => i.label).join(', ');
    throw new AppError('launch_blocked', `Launch blocked — missing critical approvals: ${missing}.`);
  }
}

export interface LiveCampaignGate {
  allowed: boolean;
  /** Why live campaigns are blocked, if they are. */
  reasons: string[];
  launchEligible: boolean;
  capabilityAllowed: boolean;
  readiness: LaunchReadiness;
}

/**
 * The combined live-campaign gate: approvals complete AND the runtime mode
 * permits live campaigns. Returns a structured result (for UIs); use
 * `assertLiveCampaignAllowed` at the actual action boundary.
 */
export function evaluateLiveCampaignGate(
  state: LaunchApprovalState,
  capabilities: Pick<ModeCapabilities, 'allowLiveCampaigns' | 'mode'>,
): LiveCampaignGate {
  const readiness = evaluateLaunchReadiness(state);
  const capabilityAllowed = capabilities.allowLiveCampaigns;
  const reasons: string[] = [];
  if (!readiness.launchEligible) {
    reasons.push(
      `Missing critical approvals: ${readiness.missingCritical.map((i) => i.label).join(', ')}.`,
    );
  }
  if (!capabilityAllowed) {
    reasons.push(
      `Runtime mode "${capabilities.mode}" does not permit live campaigns (production only).`,
    );
  }
  return {
    allowed: readiness.launchEligible && capabilityAllowed,
    reasons,
    launchEligible: readiness.launchEligible,
    capabilityAllowed,
    readiness,
  };
}

/**
 * Enforcement boundary. Throws an AppError unless live campaigns are permitted.
 * Call this before launching/enabling any live campaign — it is the reason a
 * live campaign cannot be turned on casually.
 */
export function assertLiveCampaignAllowed(
  state: LaunchApprovalState,
  capabilities: Pick<ModeCapabilities, 'allowLiveCampaigns' | 'mode'>,
): void {
  const gate = evaluateLiveCampaignGate(state, capabilities);
  if (!gate.allowed) {
    throw new AppError('live_campaign_blocked', `Live campaign blocked. ${gate.reasons.join(' ')}`);
  }
}
