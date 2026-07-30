/**
 * Presentation formatting. PRD §5.1.
 *
 * Rounding is round-half-up on the scaled integer — `Math.floor(y + 0.5)`,
 * not `Math.round` and not `toFixed` alone — so behaviour is identical across
 * engines. This module imports nothing from stats/ (types aside); it turns
 * numbers into the exact strings the copy layer interpolates.
 */

export function roundHalfUp(y: number): number {
  return Math.floor(y + 0.5);
}

/** 0.168180 -> "16.8%" */
export function formatPct(proportion: number): string {
  return `${(roundHalfUp(proportion * 1000) / 10).toFixed(1)}%`;
}

/** 51.9146 -> "51.9" (percentage points) */
export function formatPts(points: number): string {
  return (roundHalfUp(points * 10) / 10).toFixed(1);
}

/** 66343 -> "66,343" */
export function formatInt(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

/** 0.2 -> "0.20" (trailing zero kept) */
export function formatRho(rho: number): string {
  return rho.toFixed(2);
}

/** 4.6296 -> "4.6" (a plain one-dp number, e.g. effective sample size) */
export function formatOneDp(v: number): string {
  return (roundHalfUp(v * 10) / 10).toFixed(1);
}
