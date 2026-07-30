/**
 * Turns a state + result into an ordered list of interpretation lines
 * (PRD §5.2 composition order). Pure and separately tested; it knows about both
 * numbers and prose but imports no stats *functions*, only types.
 */
import { COPY, WIDTH_THRESHOLDS, BUDGET_THRESHOLDS } from "./copy";
import type { CopyKey } from "./copy";
import { formatInt, formatPct, formatPts, formatRho, formatOneDp } from "./format";
import type { WilsonInterval } from "./stats";
import type { AppState, ModeBResult } from "./appState";

export interface InterpretedLine {
  key: CopyKey;
  text: string;
}

type Tokens = Record<string, string>;

function line(key: CopyKey, tokens: Tokens): InterpretedLine {
  // Replace every {token}; an unknown token is left as-is so the "no leftover {"
  // test catches a missing substitution rather than hiding it.
  const text = COPY[key].replace(/\{(\w+)\}/g, (_m, t: string) => tokens[t] ?? `{${t}}`);
  return { key, text };
}

function designKey(design: AppState["design"]): CopyKey {
  if (design === "distinct") return "DESIGN_DISTINCT";
  if (design === "mixed") return "DESIGN_MIXED";
  return "DESIGN_SINGLE";
}

export function interpretModeA(
  state: AppState,
  result: WilsonInterval,
  designEffectValue: number,
): InterpretedLine[] {
  const { mentions, runs } = state.a;
  const pHat = mentions / runs;
  const tokens: Tokens = {
    x: formatInt(mentions),
    n: formatInt(runs),
    pointPct: formatPct(pHat),
    lowPct: formatPct(result.lower),
    highPct: formatPct(result.upper),
    widthPts: formatPts(result.widthPts),
    confPct: `${state.confidence}%`,
    rhoPct: formatRho(state.rho),
    effectiveN: formatOneDp(runs / designEffectValue),
    promptsK: formatOneDp(state.runsPerPrompt > 0 ? runs / state.runsPerPrompt : 0),
    runsPerPromptR: String(state.runsPerPrompt),
  };

  const lines: InterpretedLine[] = [line("A_HEADLINE", tokens)];

  // Exactly one width class, on the unrounded width.
  const [t8, t15, t30] = WIDTH_THRESHOLDS;
  const w = result.widthPts;
  const widthKey: CopyKey =
    w >= t30 ? "WIDTH_UNUSABLE" : w >= t15 ? "WIDTH_DIRECTIONAL" : w >= t8 ? "WIDTH_TRACKABLE" : "WIDTH_TIGHT";
  lines.push(line(widthKey, tokens));

  // Boundary overlays, in PRD §5.5 order (zero or more).
  if (mentions === 0) lines.push(line("ZERO_MENTIONS", tokens));
  if (mentions === runs) lines.push(line("ALL_MENTIONS", tokens));
  if (runs === 1) lines.push(line("SINGLE_RUN", tokens));
  if (runs >= 2 && runs <= 5) lines.push(line("TINY_N", tokens));

  lines.push(line(designKey(state.design), tokens));
  lines.push(line(state.rho === 0 ? "RHO_ZERO" : "RHO_APPLIED", tokens));
  lines.push(line("GLOBAL_LOWER_BOUND", tokens));
  return lines;
}

export function interpretModeB(
  state: AppState,
  result: ModeBResult,
): InterpretedLine[] {
  const p = state.b.planningPct;
  const targetPts = state.b.targetHalfWidthPts;
  const D = result.designEffectValue;
  const tokens: Tokens = {
    planningPct: `${p.toFixed(1)}%`,
    targetPts: targetPts.toFixed(1),
    confPct: `${state.confidence}%`,
    requiredRuns: formatInt(result.requiredRuns),
    baseRuns: formatInt(result.baseRuns),
    rhoPct: formatRho(state.rho),
    runsPerPromptR: String(state.runsPerPrompt),
    targetPtsRelaxed: result.targetPtsRelaxed.toFixed(1),
    requiredRunsRelaxed: formatInt(result.requiredRunsRelaxed),
    loBand: `${Math.max(0, p - targetPts).toFixed(1)}%`,
    hiBand: `${Math.min(100, p + targetPts).toFixed(1)}%`,
    // In Mode B the design note describes the planned sample: {n} is the runs.
    n: formatInt(result.requiredRuns),
    effectiveN: formatOneDp(result.requiredRuns / D),
    promptsK: formatOneDp(
      state.runsPerPrompt > 0 ? result.requiredRuns / state.runsPerPrompt : 0,
    ),
  };

  const lines: InterpretedLine[] = [line("B_HEADLINE", tokens)];

  // Exactly one budget class, on the final required runs.
  const [b100, b500, b2000] = BUDGET_THRESHOLDS;
  const r = result.requiredRuns;
  const budgetKey: CopyKey =
    r <= b100 ? "BUDGET_EASY" : r <= b500 ? "BUDGET_REAL" : r <= b2000 ? "BUDGET_HEAVY" : "BUDGET_UNREALISTIC";
  lines.push(line(budgetKey, tokens));

  // Boundary overlays, in PRD §5.6 order (zero or more).
  if (targetPts === 0.5) lines.push(line("TARGET_AT_FLOOR", tokens));
  if (p <= 5 || p >= 95) lines.push(line("PLANNING_EXTREME", tokens));

  lines.push(line(designKey(state.design), tokens));
  lines.push(line(state.rho === 0 ? "RHO_ZERO" : "RHO_APPLIED", tokens));
  if (D > 1) lines.push(line("B_DESIGN_INFLATED", tokens));
  lines.push(line("GLOBAL_LOWER_BOUND", tokens));
  return lines;
}
