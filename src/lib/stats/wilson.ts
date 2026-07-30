/**
 * Wilson score interval for a binomial proportion. STATS_SPEC.md §3.
 *
 * These functions assume valid input; they do not validate (that is validate.ts).
 * `n` is deliberately typed `number`, not an integer: the design effect is
 * applied by passing a non-integer effective sample size n_eff = n / D
 * (STATS_SPEC.md §5.2), and §3.1 is a continuous function of n, so there is a
 * single code path.
 */
import type { ConfidenceLevel } from "./z";
import { Z_VALUES } from "./z";

export interface WilsonInterval {
  lower: number;
  upper: number;
  centre: number;
  halfWidth: number;
  widthPts: number;
}

/**
 * Wilson interval from an already-computed proportion `pHat` at sample size `n`.
 * Applies the snap-then-clamp rule from §3.3: snap on pHat <= 0 and pHat >= 1
 * BEFORE clamping, because the spurious floating-point value is positive and
 * clamping alone would not remove it.
 */
export function wilsonFromProportion(
  pHat: number,
  n: number,
  confidence: ConfidenceLevel,
): WilsonInterval {
  const z = Z_VALUES[confidence];
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (pHat + z2 / (2 * n)) / denom;
  const half =
    (z / denom) * Math.sqrt((pHat * (1 - pHat)) / n + z2 / (4 * n * n));

  const lower = pHat <= 0 ? 0 : Math.min(1, Math.max(0, centre - half));
  const upper = pHat >= 1 ? 1 : Math.min(1, Math.max(0, centre + half));

  // widthPts is unrounded; rounding belongs to format.ts.
  return { lower, upper, centre, halfWidth: half, widthPts: (upper - lower) * 100 };
}

/** Wilson interval from raw counts: x successes in n trials. */
export function wilsonInterval(
  successes: number,
  trials: number,
  confidence: ConfidenceLevel,
): WilsonInterval {
  return wilsonFromProportion(successes / trials, trials, confidence);
}

/** The Wilson half-width alone, before snapping/clamping. */
export function wilsonHalfWidth(
  pHat: number,
  n: number,
  confidence: ConfidenceLevel,
): number {
  const z = Z_VALUES[confidence];
  const z2 = z * z;
  const denom = 1 + z2 / n;
  return (z / denom) * Math.sqrt((pHat * (1 - pHat)) / n + z2 / (4 * n * n));
}
