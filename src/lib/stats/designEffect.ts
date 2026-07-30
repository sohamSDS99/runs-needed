/**
 * Clustered-sampling design effect. STATS_SPEC.md §5.2.
 *
 *   D     = 1 + (R - 1) * rho     (Kish design effect)
 *   n_eff = n / D
 *
 * designEffect returns exactly 1 when rho === 0 for any R, so the unadjusted
 * path is the same code path (fixture D05).
 */

export type Design = "single" | "distinct" | "mixed";

export function designEffect(runsPerPrompt: number, rho: number): number {
  return 1 + (runsPerPrompt - 1) * rho;
}

export function effectiveSampleSize(n: number, D: number): number {
  return n / D;
}

export const RHO_PRESETS: readonly number[] = Object.freeze([0, 0.05, 0.1, 0.2]);

export const RHO_MAX = 0.9;
