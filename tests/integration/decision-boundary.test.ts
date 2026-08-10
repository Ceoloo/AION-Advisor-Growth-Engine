import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE_BASED_CAPABILITIES } from '@aion/shared';

/**
 * Architecture guardrail: the rules-vs-AI boundary is enforced, not just
 * documented. Rule-based domains (scoring, qualification, routing, compliance,
 * consent, lifecycle, KPI) must make NO LLM calls — so they never import the AI
 * gateway or its generative engines. This test fails if that ever regresses.
 */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Packages that must stay purely deterministic (no AI gateway anywhere). */
const RULE_BASED_PACKAGES = ['scorecard', 'compliance', 'analytics', 'scheduling', 'clients', 'observability'];

/**
 * Tokens that unambiguously indicate an LLM call / gateway dependency. We match
 * on the AI package import and the gateway API — NOT on generative function
 * names, since a deterministic module may legitimately define its own function
 * of the same name (e.g. @aion/scorecard's own deterministic advisor brief).
 */
const AI_TOKENS = ["from '@aion/ai'", 'from "@aion/ai"', 'getGateway', 'generateStructured', 'AIGateway'];

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue;
      out.push(...tsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('rules-vs-AI decision boundary is enforced', () => {
  it('the manifest lists the seven rule-based capabilities', () => {
    expect(RULE_BASED_CAPABILITIES).toEqual(
      expect.arrayContaining([
        'scoring',
        'qualification',
        'routing',
        'compliance',
        'consent',
        'lifecycle_state',
        'kpi_calculations',
      ]),
    );
  });

  for (const pkg of RULE_BASED_PACKAGES) {
    it(`@aion/${pkg} makes no LLM calls (stays deterministic)`, () => {
      const src = join(repoRoot, 'packages', pkg, 'src');
      const offenders: string[] = [];
      for (const file of tsFiles(src)) {
        const content = readFileSync(file, 'utf8');
        for (const token of AI_TOKENS) {
          if (content.includes(token)) {
            offenders.push(`${file.replace(repoRoot, '.')} → ${token}`);
          }
        }
      }
      expect(offenders, `AI usage found in rule-based package @aion/${pkg}`).toEqual([]);
    });
  }
});
