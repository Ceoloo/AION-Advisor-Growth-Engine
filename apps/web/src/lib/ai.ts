import { AIGateway, createProvider } from '@aion/ai';
import { loadEnv } from '@aion/shared';

/** Build an AI gateway from environment config. Defaults to the mock provider. */
export function getGateway(): AIGateway {
  const env = loadEnv();
  const provider = createProvider({
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  });
  return new AIGateway(provider);
}
