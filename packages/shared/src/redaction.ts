/**
 * Sensitive-field masking. This platform handles financial and health-related
 * information, so structured logs and error payloads must never carry raw PII,
 * secrets, or health data. `redact()` deep-clones an object and masks any key
 * that looks sensitive plus any obvious secret-shaped value.
 */

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /ssn|social.?security/i,
  /tax.?id/i,
  /dob|date.?of.?birth|birth.?date/i,
  /medicaid|medicare.?id/i,
  /diagnosis|prescription|chronic|health.?condition/i,
  /account.?number/i,
  /routing.?number/i,
  /card.?number|cvv|cvc/i,
  /email/i,
  /phone/i,
];

export const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

export function redact<T>(value: T, depth = 0): T {
  if (depth > 8 || value == null) return value;

  if (Array.isArray(value)) {
    return value.map((v) => redact(v, depth + 1)) as unknown as T;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redact(val, depth + 1);
      }
    }
    return out as T;
  }

  return value;
}

/** Mask all but the last N characters (e.g. for display of a phone/last-4). */
export function maskTail(input: string, visible = 4): string {
  if (input.length <= visible) return REDACTED;
  return `${'*'.repeat(input.length - visible)}${input.slice(-visible)}`;
}
