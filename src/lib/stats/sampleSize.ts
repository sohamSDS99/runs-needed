/**
 * Mode B: the smallest number of runs achieving a target half-width.
 * STATS_SPEC.md §4.
 *
 *   n* = min { n in Z+ : h(p, n, z) <= w }
 *
 * h is the Wilson half-width evaluated at the continuous planning proportion p
 * (never at round(p*n)/n), which makes h a smooth, strictly-decreasing function
 * of n and therefore binary-searchable. The Wald closed form z^2 p(1-p)/w^2 is
 * NOT used — it under-sizes at small p and returns 0 at p = 0.
 */
import type { ConfidenceLevel } from "./z";
import { Z_VALUES } from "./z";
import { wilsonHalfWidth } from "./wilson";

// Hard cap so a bug cannot hang the browser. Unreachable for inputs in range
// (the largest real answer is 66,343 at p=0.5, w=0.005, 99%).
const BRACKET_CAP = 2 ** 31;

export function requiredRuns(
  planningProportion: number,
  targetHalfWidth: number,
  confidence: ConfidenceLevel,
): number {
  const p = planningProportion;
  const target = targetHalfWidth;

  // Exponential bracketing.
  let hi = 1;
  while (wilsonHalfWidth(p, hi, confidence) > target) {
    hi *= 2;
    if (hi > BRACKET_CAP) {
      throw new Error("requiredRuns: bracketing exceeded 2^31");
    }
  }

  // Binary search for the smallest n with half-width <= target.
  let lo = 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (wilsonHalfWidth(p, mid, confidence) <= target) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

export function requiredRunsAdjusted(
  planningProportion: number,
  targetHalfWidth: number,
  confidence: ConfidenceLevel,
  designEffectValue: number,
): { baseRuns: number; requiredRuns: number } {
  const baseRuns = requiredRuns(planningProportion, targetHalfWidth, confidence);
  return { baseRuns, requiredRuns: Math.ceil(baseRuns * designEffectValue) };
}

/**
 * Runs needed so the upper Wilson bound at x = 0 sits at or below a target.
 * STATS_SPEC.md §4.3: n = floor(z^2 (1 - U) / U) + 1. Supplies the two
 * constants in the ZERO_MENTIONS copy string (73 and 381 at 95%).
 */
export function upperBoundRuns(
  targetUpperBound: number,
  confidence: ConfidenceLevel,
): number {
  const z = Z_VALUES[confidence];
  const z2 = z * z;
  return Math.floor((z2 * (1 - targetUpperBound)) / targetUpperBound) + 1;
}
