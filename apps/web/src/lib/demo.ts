/**
 * Server-side data access for the web app. In the MVP skeleton this reads from
 * the in-memory demo store (@aion/database/demo). The function boundary is the
 * seam where a live Supabase-backed repository is swapped in for production —
 * pages and API routes never touch the store directly.
 */
import { DemoStore, type DemoOrg } from '@aion/database/demo';
import { isDemoMode as isEffectiveDemoMode } from '@aion/shared';
import { getActiveClient, type ClientConfig } from '@aion/clients';

// A single store instance per server process keeps the demo data stable.
const store = new DemoStore(42);

/** The active client configuration (Ben by default; AION_ACTIVE_CLIENT overrides). */
export function getActiveClientConfig(): ClientConfig {
  return getActiveClient();
}

/**
 * The organization the app signs in as — resolved from the active ClientConfig,
 * not hardcoded. Set AION_ACTIVE_CLIENT to boot into a different advisor tenant.
 */
export const DEMO_ORG_ID = getActiveClient().organizationId;

/**
 * True when the EFFECTIVE runtime mode is demo (see @aion/shared/mode). This is
 * the resolved mode — not just the DEMO_MODE flag — so it correctly reports
 * pilot/production once the gated activation checks pass.
 */
export function isDemoMode(): boolean {
  return isEffectiveDemoMode();
}

export function getStore(): DemoStore {
  return store;
}

export function getActiveOrg(orgId: string = DEMO_ORG_ID): DemoOrg {
  const org = store.org(orgId);
  if (!org) throw new Error(`Unknown organization: ${orgId}`);
  return org;
}

export function getLeadDetail(leadId: string, orgId: string = DEMO_ORG_ID) {
  return store.getLeadDetail(orgId, leadId);
}
