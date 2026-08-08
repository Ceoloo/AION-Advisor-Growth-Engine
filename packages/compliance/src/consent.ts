/**
 * Consent evaluation for outbound communications (TCPA / CAN-SPAM alignment).
 * A channel is only contactable when a granted, unexpired consent exists.
 * This is a technical control, not legal advice — see docs/compliance-considerations.md.
 */
import type { ConsentStatus, ConsentType, MessageChannel } from '@aion/types';

export interface ConsentLike {
  type: ConsentType;
  status: ConsentStatus;
  capturedAt: string;
  expiresAt?: string | null;
}

const CHANNEL_TO_CONSENT: Partial<Record<MessageChannel, ConsentType>> = {
  sms: 'sms',
  email: 'email',
  call: 'call',
  voicemail: 'call',
};

export function canContactOnChannel(
  channel: MessageChannel,
  consents: ConsentLike[],
  now: Date = new Date(),
): boolean {
  const required = CHANNEL_TO_CONSENT[channel];
  if (!required) return true; // notes/chat are internal
  return consents.some((c) => {
    if (c.type !== required) return false;
    if (c.status !== 'granted') return false;
    if (c.expiresAt && new Date(c.expiresAt) < now) return false;
    return true;
  });
}
