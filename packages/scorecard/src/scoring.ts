/**
 * Deterministic scorecard scoring. Pure functions over the question bank and
 * section config — no AI, no side effects, fully reproducible. The primary leak
 * is chosen by NORMALIZED percentage (not raw points) because sections have
 * different maximums; near-ties collapse to "Multiple / Systemic".
 */
import { round } from '@aion/shared';
import { QUESTIONS, QUESTIONS_BY_ID } from './questions.js';
import { SECTIONS, SECTION_ORDER, type SectionId } from './sections.js';
import { bandForScore } from './bands.js';
import type { Answers, Finding, ScorecardResult, SectionScore } from './types.js';

/** Sections whose normalized pct is within this of the minimum are "tied". */
export const TIE_TOLERANCE = 0.03;

function earnedForQuestion(qId: string, answers: Answers): number {
  const q = QUESTIONS_BY_ID[qId];
  if (!q) return 0;
  const idx = answers[qId];
  if (idx == null || idx < 0 || idx >= q.options.length) return 0;
  return q.options[idx]!.points;
}

export function computeScorecard(answers: Answers): ScorecardResult {
  // --- Section scores --------------------------------------------------------
  const sections: SectionScore[] = SECTION_ORDER.map((sid) => {
    const cfg = SECTIONS[sid];
    const earned = QUESTIONS.filter((q) => q.section === sid).reduce(
      (sum, q) => sum + earnedForQuestion(q.id, answers),
      0,
    );
    return { id: sid, label: cfg.label, earned, max: cfg.maxPoints, pct: earned / cfg.maxPoints };
  });

  const total = sections.reduce((sum, s) => sum + s.earned, 0);
  const band = bandForScore(total);

  // --- Primary leak (normalized) --------------------------------------------
  const minPct = Math.min(...sections.map((s) => s.pct));
  const tied = sections
    .filter((s) => s.pct <= minPct + TIE_TOLERANCE)
    .sort((a, b) => a.pct - b.pct || SECTIONS[a.id].order - SECTIONS[b.id].order);
  const leakSection: SectionId = tied[0]!.id;
  const systemic = tied.length >= 2;
  const primaryLeak = systemic
    ? { key: 'multiple_systemic' as const, label: 'Multiple / Systemic' }
    : { key: leakSection, label: SECTIONS[leakSection].label };

  // --- Strengths (highest 1–2 normalized) -----------------------------------
  const strengths = [...sections]
    .sort((a, b) => b.pct - a.pct || SECTIONS[a.id].order - SECTIONS[b.id].order)
    .filter((s) => s.pct >= 0.6) // only claim a strength when it is actually strong
    .slice(0, 2)
    .map((s) => ({ id: s.id, label: s.label, statement: SECTIONS[s.id].strength }));

  // --- Findings (largest normalized gaps first) ------------------------------
  const findings: Finding[] = QUESTIONS.map((q) => {
    const earned = earnedForQuestion(q.id, answers);
    const idx = answers[q.id] ?? 0;
    const gapFraction = (q.maxPoints - earned) / q.maxPoints;
    return { q, earned, idx, gapFraction };
  })
    .filter((f) => f.gapFraction > 0)
    .sort(
      (a, b) =>
        b.gapFraction - a.gapFraction ||
        SECTIONS[a.q.section].order - SECTIONS[b.q.section].order ||
        a.q.order - b.q.order,
    )
    .slice(0, 3)
    .map(
      ({ q, earned, idx }): Finding => ({
        questionId: q.id,
        section: q.section,
        prompt: q.prompt,
        selectedOption: q.options[idx]?.label ?? '',
        observedGap: `You selected “${q.options[idx]?.label ?? ''}” (${earned}/${q.maxPoints} points).`,
        whyItMatters: q.whyItMatters,
        implication: q.implication,
        earned,
        max: q.maxPoints,
      }),
    );

  const recommendedFirstFix = systemic
    ? `Your journey is leaking in several places at once. Start with ${SECTIONS[leakSection].label}: ${SECTIONS[leakSection].firstFix}`
    : SECTIONS[leakSection].firstFix;

  return {
    total,
    band: band.label,
    bandKey: band.key,
    sections: sections.map((s) => ({ ...s, pct: round(s.pct, 4) })),
    primaryLeak,
    leakSection,
    strengths,
    findings,
    recommendedFirstFix,
    plan30Day: [...SECTIONS[leakSection].plan30Day],
  };
}

/** Convenience: total possible points (should be 100). */
export function maxTotalPoints(): number {
  return QUESTIONS.reduce((sum, q) => sum + q.maxPoints, 0);
}
