/**
 * The integration registry declares every provider the platform intends to
 * support. GoHighLevel is the only one marked `implemented` in the MVP; the
 * rest are mocked placeholders surfaced in the Integrations UI so the roadmap
 * is visible and health checks return a consistent shape.
 */
import type { IntegrationProvider } from '@aion/types';
import { MockAdapter, type IntegrationAdapter, type IntegrationCapability } from './adapter.js';

interface Spec {
  provider: IntegrationProvider;
  capabilities: IntegrationCapability[];
  implemented?: boolean;
}

const SPECS: Spec[] = [
  { provider: 'gohighlevel', capabilities: ['crm', 'sms', 'email', 'calendar', 'automation'], implemented: true },
  { provider: 'twilio', capabilities: ['sms', 'voice'] },
  { provider: 'telnyx', capabilities: ['sms', 'voice'] },
  { provider: 'sendgrid', capabilities: ['email'] },
  { provider: 'mailgun', capabilities: ['email'] },
  { provider: 'stripe', capabilities: ['payments'] },
  { provider: 'square', capabilities: ['payments'] },
  { provider: 'docusign', capabilities: ['e_signature'] },
  { provider: 'pandadoc', capabilities: ['e_signature'] },
  { provider: 'google_calendar', capabilities: ['calendar'] },
  { provider: 'outlook_calendar', capabilities: ['calendar'] },
  { provider: 'google_drive', capabilities: ['storage'] },
  { provider: 'dropbox', capabilities: ['storage'] },
  { provider: 'clearbit', capabilities: ['enrichment'] },
  { provider: 'apollo', capabilities: ['enrichment'] },
  { provider: 'zapier', capabilities: ['automation'] },
  { provider: 'make', capabilities: ['automation'] },
  { provider: 'n8n', capabilities: ['automation'] },
  { provider: 'carrier_api', capabilities: ['carrier'] },
  { provider: 'quote_platform', capabilities: ['quoting'] },
  { provider: 'enrichment', capabilities: ['enrichment'] },
];

export function buildRegistry(): Map<IntegrationProvider, IntegrationAdapter> {
  const registry = new Map<IntegrationProvider, IntegrationAdapter>();
  for (const spec of SPECS) {
    registry.set(spec.provider, new MockAdapter(spec.provider, spec.capabilities, spec.implemented ?? false));
  }
  return registry;
}

export const INTEGRATION_REGISTRY = buildRegistry();

export function listAdapters(): IntegrationAdapter[] {
  return [...INTEGRATION_REGISTRY.values()];
}
