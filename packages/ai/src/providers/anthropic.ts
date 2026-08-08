/**
 * Anthropic provider — a minimal fetch wrapper over the Messages API. No SDK
 * dependency so the skeleton stays lean. Pricing is approximate and used only
 * for cost tracking; adjust per the current rate card.
 */
import type { AICompletion, AICompletionRequest, AIProvider } from '../gateway.js';

const PRICE_PER_MTOK = { input: 3, output: 15 }; // approximate USD / million tokens

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly baseUrl = 'https://api.anthropic.com',
  ) {}

  async complete(request: AICompletionRequest): Promise<AICompletion> {
    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.2,
        system: request.system,
        messages: [{ role: 'user', content: request.prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content: { type: string; text?: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    const text = data.content.map((c) => c.text ?? '').join('');
    const inputTokens = data.usage.input_tokens;
    const outputTokens = data.usage.output_tokens;

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
