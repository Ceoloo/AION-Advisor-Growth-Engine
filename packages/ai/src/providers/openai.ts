/**
 * OpenAI provider — minimal fetch wrapper over the Chat Completions API. Kept
 * dependency-free; enable JSON mode for structured tasks.
 */
import type { AICompletion, AICompletionRequest, AIProvider } from '../gateway.js';

const PRICE_PER_MTOK = { input: 0.5, output: 1.5 }; // approximate USD / million tokens

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly baseUrl = 'https://api.openai.com',
  ) {}

  async complete(request: AICompletionRequest): Promise<AICompletion> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 1024,
        response_format: { type: 'json_object' },
        messages: [
          ...(request.system ? [{ role: 'system', content: request.system }] : []),
          { role: 'user', content: request.prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    const text = data.choices[0]?.message.content ?? '';
    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;

    return {
      text,
      usage: {
        provider: this.name,
        model: this.model,
        inputTokens,
        outputTokens,
        costUsd:
          (inputTokens / 1e6) * PRICE_PER_MTOK.input + (outputTokens / 1e6) * PRICE_PER_MTOK.output,
      },
    };
  }
}
