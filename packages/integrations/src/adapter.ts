/**
 * Pluggable integration adapter framework. GoHighLevel is implemented first
 * (in @aion/ghl); every other provider ships as an interface plus a mocked
 * adapter so the surface exists without a live implementation. Register real
 * adapters as they are built — callers depend only on the interface.
 */
import type { IntegrationProvider, IntegrationStatus } from '@aion/types';

export type IntegrationCapability =
  | 'crm'
  | 'sms'
  | 'voice'
  | 'email'
  | 'payments'
  | 'e_signature'
  | 'calendar'
  | 'storage'
  | 'enrichment'
  | 'automation'
  | 'carrier'
  | 'quoting';

export interface HealthCheckResult {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  checkedAt: string;
  latencyMs?: number;
  message?: string;
}

export interface IntegrationAdapter {
  readonly provider: IntegrationProvider;
  readonly capabilities: IntegrationCapability[];
  /** Whether a live implementation exists, or this is a mocked placeholder. */
  readonly implemented: boolean;
  healthCheck(): Promise<HealthCheckResult>;
}

/** Base class for the many not-yet-implemented providers. */
export class MockAdapter implements IntegrationAdapter {
  constructor(
    readonly provider: IntegrationProvider,
    readonly capabilities: IntegrationCapability[],
    readonly implemented = false,
  ) {}

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      provider: this.provider,
      status: this.implemented ? 'connected' : 'not_configured',
      checkedAt: new Date().toISOString(),
      message: this.implemented ? 'ok (mock)' : 'Mocked adapter — no live implementation yet',
    };
  }
}
