/**
 * UI form state and the Mode A computation. The reducer holds the raw input
 * strings (so a transiently-invalid entry is preserved on screen, PRD §6.2)
 * and the parsed numeric AppState of PRD §8.2 is derived on demand.
 */
import {
  designEffect,
  effectiveSampleSize,
  wilsonFromProportion,
  wilsonHalfWidth,
  requiredRunsAdjusted,
} from "./stats";
import type {
  ConfidenceLevel,
  Design,
  ModeAInput,
  ModeBInput,
  WilsonInterval,
} from "./stats";
import { formatOneDp } from "./format";

export type Mode = "a" | "b";

export interface FormState {
  mode: Mode;
  mentions: string;
  runs: string;
  planningPct: string;
  targetHalfWidthPts: string;
  confidence: ConfidenceLevel;
  design: Design;
  rho: string;
  runsPerPrompt: string;
}

export const DEFAULT_FORM: FormState = {
  mode: "a",
  mentions: "4",
  runs: "10",
  planningPct: "42",
  targetHalfWidthPts: "5",
  confidence: 95,
  design: "single",
  rho: "0",
  runsPerPrompt: "10",
};

export type Action =
  | { type: "mentions"; value: string }
  | { type: "runs"; value: string }
  | { type: "planningPct"; value: string }
  | { type: "targetHalfWidthPts"; value: string }
  | { type: "confidence"; value: ConfidenceLevel }
  | { type: "design"; value: Design }
  | { type: "rho"; value: string }
  | { type: "runsPerPrompt"; value: string }
  | { type: "mode"; value: Mode }
  | { type: "hydrate"; value: FormState };

export function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "hydrate":
      return action.value;
    case "mentions":
      return { ...state, mentions: action.value };
    case "runs":
      return { ...state, runs: action.value };
    case "planningPct":
      return { ...state, planningPct: action.value };
    case "targetHalfWidthPts":
      return { ...state, targetHalfWidthPts: action.value };
    case "confidence":
      return { ...state, confidence: action.value };
    case "design":
      return { ...state, design: action.value };
    case "rho":
      return { ...state, rho: action.value };
    case "runsPerPrompt":
      return { ...state, runsPerPrompt: action.value };
    case "mode":
      return { ...state, mode: action.value };
    default:
      return state;
  }
}

/** Build the validator input from the raw form (numbers may be NaN). */
export function formToModeAInput(f: FormState): ModeAInput {
  return {
    mentions: Number(f.mentions),
    runs: Number(f.runs),
    confidence: f.confidence,
    rho: Number(f.rho),
    design: f.design,
    runsPerPrompt: Number(f.runsPerPrompt),
  };
}

/**
 * The cluster size R by design (STATS_SPEC §5.1): a single prompt run n times
 * is one cluster of size n; distinct prompts are clusters of size 1 (D=1);
 * mixed uses the entered runs-per-prompt.
 */
function clusterSize(f: FormState): number {
  const n = Number(f.runs);
  if (f.design === "distinct") return 1;
  if (f.design === "mixed") return Number(f.runsPerPrompt);
  return n;
}

export interface ModeAResult {
  interval: WilsonInterval;
  designEffectValue: number;
  effectiveN: number;
  pHat: number;
  mentions: number;
  runs: number;
}

export function computeModeA(f: FormState): ModeAResult {
  const mentions = Number(f.mentions);
  const runs = Number(f.runs);
  const rho = Number(f.rho);
  const D = designEffect(clusterSize(f), rho);
  const effectiveN = effectiveSampleSize(runs, D);
  const pHat = mentions / runs;
  const interval = wilsonFromProportion(pHat, effectiveN, f.confidence);
  return { interval, designEffectValue: D, effectiveN, pHat, mentions, runs };
}

export function formToModeBInput(f: FormState): ModeBInput {
  return {
    planningPct: Number(f.planningPct),
    targetHalfWidthPts: Number(f.targetHalfWidthPts),
    confidence: f.confidence,
    rho: Number(f.rho),
    design: f.design,
    runsPerPrompt: Number(f.runsPerPrompt),
  };
}

export interface ModeBResult {
  requiredRuns: number;
  baseRuns: number;
  designEffectValue: number;
  halfWidthAtN: number;
  halfWidthAtNMinus1: number | null;
  planningPct: number;
  targetPts: number;
  targetPtsRelaxed: number;
  requiredRunsRelaxed: number;
}

export function computeModeB(f: FormState): ModeBResult {
  const p = Number(f.planningPct) / 100;
  const targetPts = Number(f.targetHalfWidthPts);
  const w = targetPts / 100;
  const rho = Number(f.rho);
  // The design effect only inflates the clustered design; single/distinct give
  // D = 1 (matches fixtures N01–N03).
  const R = f.design === "mixed" ? Number(f.runsPerPrompt) : 1;
  const D = designEffect(R, rho);
  const { baseRuns, requiredRuns } = requiredRunsAdjusted(p, w, f.confidence, D);
  // Minimality is proved against the base (independent-observation) requirement.
  const halfWidthAtN = wilsonHalfWidth(p, baseRuns, f.confidence);
  const halfWidthAtNMinus1 =
    baseRuns > 1 ? wilsonHalfWidth(p, baseRuns - 1, f.confidence) : null;
  // Relaxed target (×2, capped at 50 points) for the "loosening" copy.
  const targetPtsRelaxed = Math.min(50, targetPts * 2);
  const requiredRunsRelaxed = requiredRunsAdjusted(
    p,
    targetPtsRelaxed / 100,
    f.confidence,
    D,
  ).requiredRuns;
  return {
    requiredRuns,
    baseRuns,
    designEffectValue: D,
    halfWidthAtN,
    halfWidthAtNMinus1,
    planningPct: Number(f.planningPct),
    targetPts,
    targetPtsRelaxed,
    requiredRunsRelaxed,
  };
}

/** The parsed numeric application state of PRD §8.2 (what interpret.ts consumes). */
export interface AppState {
  mode: Mode;
  a: { mentions: number; runs: number };
  b: { planningPct: number; targetHalfWidthPts: number };
  confidence: ConfidenceLevel;
  design: Design;
  rho: number;
  runsPerPrompt: number;
}

export function appStateToForm(s: AppState): FormState {
  return {
    mode: s.mode,
    mentions: String(s.a.mentions),
    runs: String(s.a.runs),
    planningPct: String(s.b.planningPct),
    targetHalfWidthPts: String(s.b.targetHalfWidthPts),
    confidence: s.confidence,
    design: s.design,
    rho: String(s.rho),
    runsPerPrompt: String(s.runsPerPrompt),
  };
}

export function formToAppState(f: FormState): AppState {
  return {
    mode: f.mode,
    a: { mentions: Number(f.mentions), runs: Number(f.runs) },
    b: {
      planningPct: Number(f.planningPct),
      targetHalfWidthPts: Number(f.targetHalfWidthPts),
    },
    confidence: f.confidence,
    design: f.design,
    rho: Number(f.rho),
    runsPerPrompt: Number(f.runsPerPrompt),
  };
}

/** Plain-language description of the sampling design (PRD §9.1 sr-only <dl>). */
export function describeSamplingDesign(f: FormState): string {
  const n = Number(f.runs);
  if (f.design === "distinct") return `${n} different prompts, run once each`;
  if (f.design === "mixed") {
    const R = Number(f.runsPerPrompt);
    const k = R > 0 ? n / R : 0;
    return `About ${formatOneDp(k)} prompts, ${R} runs each`;
  }
  return `One prompt run ${n} times`;
}
