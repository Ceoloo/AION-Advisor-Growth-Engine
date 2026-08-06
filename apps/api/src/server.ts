/**
 * Minimal, dependency-free HTTP service. Demonstrates the "separate Node API
 * service" option from the brief while reusing the same domain packages as the
 * web app. Every request gets a correlation id and structured logging; all
 * business logic lives in @aion packages, not here.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { logger, newCorrelationId, loadEnv } from '@aion/shared';

type Handler = (ctx: RequestContext) => Promise<JsonResponse> | JsonResponse;
export interface JsonResponse {
  status: number;
  body: unknown;
}
export interface RequestContext {
  method: string;
  path: string;
  rawBody: string;
  json<T = unknown>(): T | null;
  headers: IncomingMessage['headers'];
  correlationId: string;
}

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export class ApiServer {
  private routes: Route[] = [];
  private readonly log = logger.child({ service: 'api' });

  route(method: string, path: string, handler: Handler): this {
    this.routes.push({ method: method.toUpperCase(), path, handler });
    return this;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const correlationId = newCorrelationId();
    const method = req.method ?? 'GET';
    const path = (req.url ?? '/').split('?')[0] ?? '/';

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    const match = this.routes.find((r) => r.method === method && r.path === path);
    const log = this.log.child({ correlationId, method, path });

    if (!match) {
      this.send(res, 404, { ok: false, error: 'not_found' }, correlationId);
      return;
    }

    try {
      const ctx: RequestContext = {
        method,
        path,
        rawBody,
        headers: req.headers,
        correlationId,
        json: <T = unknown>() => {
          try {
            return rawBody ? (JSON.parse(rawBody) as T) : null;
          } catch {
            return null;
          }
        },
      };
      const result = await match.handler(ctx);
      this.send(res, result.status, result.body, correlationId);
      log.info('request handled', { status: result.status });
    } catch (err) {
      log.error('request failed', { error: err instanceof Error ? err.message : String(err) });
      this.send(res, 500, { ok: false, error: 'internal_error' }, correlationId);
    }
  }

  private send(res: ServerResponse, status: number, body: unknown, correlationId: string): void {
    res.writeHead(status, { 'content-type': 'application/json', 'x-correlation-id': correlationId });
    res.end(JSON.stringify(body));
  }

  listen(port: number): void {
    const server = createServer((req, res) => void this.handle(req, res));
    server.listen(port, () => {
      this.log.info('api listening', { port, demoMode: loadEnv().DEMO_MODE });
    });
  }
}
