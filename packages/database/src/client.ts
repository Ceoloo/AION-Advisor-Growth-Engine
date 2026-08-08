/**
 * Supabase client factory. Kept dependency-light: the client is created lazily
 * so demo mode never needs @supabase/supabase-js installed or configured. In a
 * live deployment install the SDK and replace the dynamic import guard.
 *
 * Two client kinds:
 *  - anon/browser client: subject to Row-Level Security (safe for the browser).
 *  - service client: bypasses RLS — server-only, and callers MUST scope every
 *    query by organization_id (see @aion/auth scopeToTenant / assertSameTenant).
 */
export interface SupabaseClientConfig {
  url: string;
  key: string;
}

export interface DatabaseHandle {
  kind: 'anon' | 'service';
  config: SupabaseClientConfig;
  // The concrete SupabaseClient is attached at runtime in live deployments.
  raw?: unknown;
}

let warned = false;

/**
 * Returns a lightweight handle describing the intended connection. Constructing
 * the real client is deferred to the deployment layer to keep the skeleton
 * runnable offline. Throwing here would break demo mode, so we warn instead.
 */
export function createDatabaseHandle(
  kind: 'anon' | 'service',
  config: Partial<SupabaseClientConfig>,
): DatabaseHandle {
  if ((!config.url || !config.key) && !warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[@aion/database] No Supabase credentials configured — running against demo data only.',
    );
  }
  return { kind, config: { url: config.url ?? '', key: config.key ?? '' } };
}
