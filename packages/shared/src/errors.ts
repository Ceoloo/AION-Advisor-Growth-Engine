/**
 * Typed application errors with safe, client-facing messages. Internal details
 * stay on the instance for logging; `toClient()` never leaks them.
 */
export type AppErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'tenant_violation'
  | 'demo_blocked'
  | 'launch_blocked'
  | 'live_campaign_blocked'
  | 'integration_error'
  | 'internal';

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  tenant_violation: 403,
  demo_blocked: 403,
  launch_blocked: 403,
  live_campaign_blocked: 403,
  integration_error: 502,
  internal: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  toClient(): { error: string; code: AppErrorCode } {
    return { error: this.message, code: this.code };
  }
}

export const demoBlocked = (action: string) =>
  new AppError('demo_blocked', `Action "${action}" is disabled in demo mode.`);

export const tenantViolation = () =>
  new AppError('tenant_violation', 'Resource does not belong to the active organization.');
