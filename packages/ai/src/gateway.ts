/**
 * Provider-agnostic AI gateway.
 *
 * The rest of the platform depends only on this interface — never on a specific
 * vendor SDK. Swap providers by configuration (AI_PROVIDER). Every structured
 * call validates the model output against a Zod schema and fails safe.
 */
import type { z } from 'zod';
import { AppError } from '@aion/shared';

export interface AICompletionRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AICompletion {
  text: string;
  usage: AIUsage;
}

/** A raw provider — the only thing a vendor integration must implement. */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  complete(request: AICompletionRequest): Promise<AICompletion>;
}

export type StructuredResult<T> =
  | { ok: true; data: T; usage: AIUsage }
  | { ok: false; error: string; raw?: string; usage?: AIUsage };

export class AIGateway {
  constructor(
    private readonly provider: AIProvider,
    private readonly onUsage?: (usage: AIUsage) => void,
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  async complete(request: AICompletionRequest): Promise<AICompletion> {
    const result = await this.provider.complete(request);
    this.onUsage?.(result.usage);
    return result;
  }

  /**
   * Generate JSON and validate it against `schema`. On any parse/validation
   * failure this returns `{ ok: false }` — it never throws malformed data into
   * the caller, so downstream workflows can degrade gracefully.
   */
  async generateStructured<T extends z.ZodTypeAny>(
    schema: T,
    request: AICompletionRequest,
  ): Promise<StructuredResult<z.infer<T>>> {
    const system = [
      request.system ?? '',
      'You must respond with a single valid JSON object and nothing else.',
    ]
      .filter(Boolean)
      .join('\n');

    let completion: AICompletion;
    try {
      completion = await this.complete({ ...request, system });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'provider_error' };
    }

    const json = extractJson(completion.text);
    if (json === null) {
      return { ok: false, error: 'no_json_in_response', raw: completion.text, usage: completion.usage };
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        error: 'schema_validation_failed',
        raw: completion.text,
        usage: completion.usage,
      };
    }

    return { ok: true, data: parsed.data, usage: completion.usage };
  }
}

/** Extract the first balanced JSON object/array from a string. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.search(/[[{]/);
  if (start === -1) return null;
  const open = trimmed[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function requireProvider(provider: AIProvider | undefined): AIProvider {
  if (!provider) {
    throw new AppError('internal', 'No AI provider configured');
  }
  return provider;
}
