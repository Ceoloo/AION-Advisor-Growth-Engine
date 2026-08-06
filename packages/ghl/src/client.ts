/**
 * Typed GoHighLevel HTTP client with retry, rate-limit handling, request
 * logging, and error normalization. All GHL service implementations funnel
 * through here. Supports both OAuth access tokens and private integration
 * (API key) credentials.
 */
import { AppError, logger as rootLogger, type Logger } from '@aion/shared';

export interface GHLClientConfig {
  baseUrl: string;
  /** OAuth access token or private-integration API key. */
  accessToken: string;
  apiVersion?: string;
  maxRetries?: number;
  logger?: Logger;
  /** Optional hook for API-usage accounting. */
  onRequest?: (info: GHLRequestLog) => void;
}

export interface GHLRequestLog {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  retries: number;
}

export class GHLClient {
  private readonly log: Logger;

  constructor(private readonly config: GHLClientConfig) {
    this.log = config.logger ?? rootLogger.child({ component: 'ghl-client' });
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const maxRetries = this.config.maxRetries ?? 3;
    const url = `${this.config.baseUrl}${path}`;
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      const started = Date.now();
      try {
        const res = await fetch(url, {
          method,
          headers: {
            authorization: `Bearer ${this.config.accessToken}`,
            version: this.config.apiVersion ?? '2021-07-28',
            'content-type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const latencyMs = Date.now() - started;
        this.config.onRequest?.({ method, path, statusCode: res.status, latencyMs, retries: attempt });

        // Respect rate limiting with exponential backoff + Retry-After.
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt;
          this.log.warn('ghl rate limited', { path, retryAfter, attempt });
          await sleep(retryAfter * 1000);
          attempt++;
          continue;
        }

        if (res.status >= 500) {
          lastError = await this.normalizeError(res);
          await sleep(2 ** attempt * 250);
          attempt++;
          continue;
        }

        if (!res.ok) {
          throw await this.normalizeError(res);
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        if (err instanceof AppError && err.code !== 'integration_error') throw err;
        if (attempt >= maxRetries) break;
        await sleep(2 ** attempt * 250);
        attempt++;
      }
    }

    this.log.error('ghl request failed after retries', { method, path });
    throw lastError instanceof AppError
      ? lastError
      : new AppError('integration_error', 'GoHighLevel request failed', { path });
  }

  private async normalizeError(res: Response): Promise<AppError> {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    return new AppError('integration_error', `GoHighLevel API error (${res.status})`, detail);
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, body);
  }
  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
