// Public surface of the stats core. Re-exports only — no logic lives here.
export type { ConfidenceLevel } from "./z";
export { Z_VALUES, CONFIDENCE_LEVELS, isConfidenceLevel } from "./z";

export type { WilsonInterval } from "./wilson";
export { wilsonInterval, wilsonFromProportion, wilsonHalfWidth } from "./wilson";

export type { Design } from "./designEffect";
export { designEffect, effectiveSampleSize, RHO_PRESETS, RHO_MAX } from "./designEffect";

export { requiredRuns, requiredRunsAdjusted, upperBoundRuns } from "./sampleSize";

export type { ErrorCode, ModeAInput, ModeBInput } from "./validate";
export { validateModeA, validateModeB, N_MAX, TARGET_MIN_PTS, TARGET_MAX_PTS } from "./validate";
