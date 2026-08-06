export * from './types.js';
export * from './client.js';
export * from './webhooks.js';
export * from './mock.js';

import { MockGHLServices } from './mock.js';
import type { GHLServices } from './types.js';

export interface GHLFactoryConfig {
  demoMode: boolean;
  accessToken?: string;
  baseUrl?: string;
}

/**
 * Resolve the GHL service surface. In demo mode (or when no credentials are
 * configured) the in-memory mock is returned so the platform runs offline.
 * With credentials, wire the live client-backed services here.
 */
export function createGHLServices(config: GHLFactoryConfig): GHLServices {
  if (config.demoMode || !config.accessToken) {
    return new MockGHLServices();
  }
  // Live client-backed services would be constructed here. For the MVP skeleton
  // we return the mock so no real GHL account is required; see
  // docs/ghl-integration.md for the go-live checklist.
  return new MockGHLServices();
}
