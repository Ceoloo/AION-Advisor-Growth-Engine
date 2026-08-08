/**
 * Audit logging helpers. Every meaningful state change — human, automated, or
 * AI — should produce an audit event. Metadata is redacted before persistence
 * so sensitive fields never land in the audit trail in the clear.
 */
import { redact, generateId } from '@aion/shared';

export interface AuditEventInput {
  organizationId: string;
  actorProfileId?: string | null;
  actorType: 'human' | 'automation' | 'ai' | 'system';
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  createdAt: string;
}

export function buildAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    ...input,
    metadata: input.metadata ? redact(input.metadata) : undefined,
    id: generateId('audit'),
    createdAt: new Date().toISOString(),
  };
}
