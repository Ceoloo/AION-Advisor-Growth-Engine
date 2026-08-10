/**
 * The client registry + resolver. This is the single source of truth for which
 * advisors the engine serves. Onboarding an advisor = adding a ClientConfig to
 * `CLIENT_CONFIGS`. The first entry is the primary client.
 *
 * The *active* client (whose branding/data the app boots into) is selected by
 * the `AION_ACTIVE_CLIENT` env var, defaulting to the primary. Selecting a
 * client is deliberately separate from going live — approval/compliance status
 * on the config, plus the runtime-mode gates in @aion/shared, govern that.
 */
import { parseClientConfig } from './schema.js';
import type { ClientConfig, TeamMember } from './types.js';
import { benPeretz } from './configs/ben-peretz.js';
import { mariaSantos } from './configs/maria-santos.js';

/** Registered clients, in priority order (index 0 is the primary client). */
export const CLIENT_CONFIGS: ClientConfig[] = [benPeretz, mariaSantos].map((c) => parseClientConfig(c));

/** Fast lookup by clientId. */
const BY_ID = new Map<string, ClientConfig>(CLIENT_CONFIGS.map((c) => [c.clientId, c]));
/** Fast lookup by organizationId. */
const BY_ORG = new Map<string, ClientConfig>(CLIENT_CONFIGS.map((c) => [c.organizationId, c]));

/** The primary (first-registered) client. */
export function getPrimaryClient(): ClientConfig {
  return CLIENT_CONFIGS[0]!;
}

export function listClients(): ClientConfig[] {
  return CLIENT_CONFIGS;
}

export function getClientById(clientId: string): ClientConfig | undefined {
  return BY_ID.get(clientId);
}

export function getClientByOrg(organizationId: string): ClientConfig | undefined {
  return BY_ORG.get(organizationId);
}

/**
 * Resolve the active client. `AION_ACTIVE_CLIENT` may name any registered
 * clientId; an unknown or empty value falls back to the primary client (safe by
 * default — the app always has a valid client to boot into).
 */
export function getActiveClient(source: NodeJS.ProcessEnv = process.env): ClientConfig {
  const requested = source.AION_ACTIVE_CLIENT?.trim();
  if (requested) {
    const found = BY_ID.get(requested);
    if (found) return found;
  }
  return getPrimaryClient();
}

/** The default lead owner for a client — the first lead-receiving team member. */
export function defaultLeadOwner(config: ClientConfig): TeamMember | undefined {
  return config.team.find((m) => m.receivesLeads) ?? config.team[0];
}

/** Team members in the lead-assignment pool (round-robin candidates). */
export function leadPool(config: ClientConfig): TeamMember[] {
  const pool = config.team.filter((m) => m.receivesLeads);
  return pool.length > 0 ? pool : config.team.slice(0, 1);
}

/** Convenience: is this client cleared (approved + compliance-approved) to run live? */
export function isClientLiveApproved(config: ClientConfig): boolean {
  return (
    (config.approval.status === 'approved' || config.approval.status === 'active') &&
    config.compliance.status === 'approved'
  );
}
