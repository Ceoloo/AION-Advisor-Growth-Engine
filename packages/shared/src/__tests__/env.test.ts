import { describe, expect, it, beforeEach } from 'vitest';
import { loadEnv, resetEnvCache } from '../env.js';

describe('loadEnv', () => {
  beforeEach(() => resetEnvCache());

  it('applies safe demo defaults with an empty environment', () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.DEMO_MODE).toBe(true);
    expect(env.AI_PROVIDER).toBe('mock');
  });

  it('throws in production when required secrets are missing and demo is off', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', DEMO_MODE: 'false' } as NodeJS.ProcessEnv),
    ).toThrow(/Missing required production environment variables/);
  });

  it('rejects invalid enum values', () => {
    expect(() => loadEnv({ AI_PROVIDER: 'nonsense' } as NodeJS.ProcessEnv)).toThrow(
      /Invalid environment configuration/,
    );
  });
});
