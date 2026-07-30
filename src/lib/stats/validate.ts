/**
 * Input validation. PRD §4.2 (Mode A) and §4.3 (Mode B).
 *
 * Rules are evaluated in the exact documented order and the FIRST failure is
 * returned; a valid input returns null. Error codes match fixtures.json.rejects.
 *
 * The input accepts either the app's field names (mentions/runs/confidence) or
 * the fixtures' shorthand (x/n/conf); whichever is present is used. This keeps
 * both the running app and the reject fixtures on one validation path.
 */
import { isConfidenceLevel } from "./z";
import type { Design } from "./designEffect";

export type ErrorCode =
  | "X_NOT_INTEGER"
  | "N_NOT_INTEGER"
  | "X_NEGATIVE"
  | "N_BELOW_MIN"
  | "N_ABOVE_MAX"
  | "X_EXCEEDS_N"
  | "CONF_NOT_ALLOWED"
  | "RHO_OUT_OF_RANGE"
  | "RUNS_PER_PROMPT_BELOW_MIN"
  | "RUNS_PER_PROMPT_EXCEEDS_N"
  | "PLANNING_OUT_OF_RANGE"
  | "TARGET_BELOW_MIN"
  | "TARGET_ABOVE_MAX";

export const N_MAX = 200000;
export const TARGET_MIN_PTS = 0.5;
export const TARGET_MAX_PTS = 50;

const RHO_MIN = 0;
const RHO_MAX = 0.9;

export interface ModeAInput {
  mentions?: number;
  runs?: number;
  confidence?: number;
  x?: number;
  n?: number;
  conf?: number;
  rho?: number;
  design?: Design;
  runsPerPrompt?: number;
}

export interface ModeBInput {
  planningPct?: number;
  targetHalfWidthPts?: number;
  confidence?: number;
  conf?: number;
  rho?: number;
  design?: Design;
  runsPerPrompt?: number;
}

export function validateModeA(i: ModeAInput): ErrorCode | null {
  const x = i.mentions ?? i.x;
  const n = i.runs ?? i.n;
  const confidence = i.confidence ?? i.conf;
  const rho = i.rho ?? 0;
  const design: Design = i.design ?? "single";
  const R = i.runsPerPrompt;

  if (x === undefined || !Number.isInteger(x)) return "X_NOT_INTEGER";
  if (n === undefined || !Number.isInteger(n)) return "N_NOT_INTEGER";
  if (x < 0) return "X_NEGATIVE";
  if (n < 1) return "N_BELOW_MIN";
  if (n > N_MAX) return "N_ABOVE_MAX";
  if (x > n) return "X_EXCEEDS_N";
  if (!isConfidenceLevel(confidence)) return "CONF_NOT_ALLOWED";
  if (rho < RHO_MIN || rho > RHO_MAX) return "RHO_OUT_OF_RANGE";
  if (design === "mixed" && R !== undefined) {
    if (R < 1) return "RUNS_PER_PROMPT_BELOW_MIN";
    if (R > n) return "RUNS_PER_PROMPT_EXCEEDS_N";
  }
  return null;
}

export function validateModeB(i: ModeBInput): ErrorCode | null {
  const p = i.planningPct;
  const w = i.targetHalfWidthPts;
  const confidence = i.confidence ?? i.conf;
  const rho = i.rho ?? 0;
  const design: Design = i.design ?? "single";
  const R = i.runsPerPrompt;

  if (p === undefined || p < 0 || p > 100) return "PLANNING_OUT_OF_RANGE";
  if (w === undefined || w < TARGET_MIN_PTS) return "TARGET_BELOW_MIN";
  if (w > TARGET_MAX_PTS) return "TARGET_ABOVE_MAX";
  if (!isConfidenceLevel(confidence)) return "CONF_NOT_ALLOWED";
  if (rho < RHO_MIN || rho > RHO_MAX) return "RHO_OUT_OF_RANGE";
  // Mode B has no total-n input, so RUNS_PER_PROMPT_EXCEEDS_N cannot apply.
  if (design === "mixed" && R !== undefined && R < 1) {
    return "RUNS_PER_PROMPT_BELOW_MIN";
  }
  return null;
}
