/**
 * Confidence levels and their two-sided standard-normal quantiles.
 *
 * Per STATS_SPEC.md §2 and PRD ADR-4: confidence is a closed set of four
 * levels, so no quantile function is implemented. The four z values are
 * `scipy.stats.norm.ppf(1 - (1 - c) / 2)` at IEEE-754 double precision,
 * copied to all 16 significant figures.
 */

export type ConfidenceLevel = 80 | 90 | 95 | 99;

export const Z_VALUES: Record<ConfidenceLevel, number> = Object.freeze({
  80: 1.2815515655446004,
  90: 1.6448536269514722,
  95: 1.959963984540054,
  99: 2.5758293035489004,
});

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = Object.freeze([
  80, 90, 95, 99,
]);

export function isConfidenceLevel(v: unknown): v is ConfidenceLevel {
  return v === 80 || v === 90 || v === 95 || v === 99;
}
