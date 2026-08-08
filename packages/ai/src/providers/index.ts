/**
 * Provider factory. Selects an AI provider from configuration. Real vendor
 * providers (OpenAI / Anthropic) are thin fetch wrappers so no SDK is required
 * for the skeleton; they fall back to the mock provider when no key is present,
 * keeping the demo runnable offline.
 */
import type { AIProvider } from '../gateway.js';
import { MockAIProvider } from './mock.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';

export interface ProviderConfig {
  provider: 'mock' | 'openai' | 'anthropic';
  model: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case 'anthropic':
      return config.anthropicApiKey
        ? new AnthropicProvider(config.anthropicApiKey, config.model)
        : new MockAIProvider();
    case 'openai':
      return config.openaiApiKey
        ? new OpenAIProvider(config.openaiApiKey, config.model)
        : new MockAIProvider();
    case 'mock':
    default:
      return new MockAIProvider();
  }
}

export { MockAIProvider, AnthropicProvider, OpenAIProvider };
