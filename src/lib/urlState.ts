/**
 * URL <-> AppState mapping. PRD §8.4 / ADR-3.
 *
 * Keys, in fixed emit order: m, x, n, p, w, c, d, r, k. A key is omitted when it
 * equals its default (so the landing state serialises to ""); k is omitted
 * unless d=mixed. Parsing is per-key: a PRESENT known key that is unparseable or
 * out of range falls back to its default AND sets `degraded`; an absent key
 * falls back silently; unknown keys are ignored silently. After parsing, x > n
 * resets x to its default and sets `degraded`.
 */
import { isConfidenceLevel } from "./stats";
import type { ConfidenceLevel, Design } from "./stats";
import type { AppState, Mode } from "./appState";

const DEFAULTS = {
  mode: "a" as Mode,
  mentions: 4,
  runs: 10,
  planningPct: 42,
  targetHalfWidthPts: 5,
  confidence: 95 as ConfidenceLevel,
  design: "single" as Design,
  rho: 0,
  runsPerPrompt: 10,
};

const N_MAX = 200000;

export function serialise(state: AppState): string {
  const parts: string[] = [];
  if (state.mode !== DEFAULTS.mode) parts.push(`m=${state.mode}`);
  if (state.a.mentions !== DEFAULTS.mentions) parts.push(`x=${state.a.mentions}`);
  if (state.a.runs !== DEFAULTS.runs) parts.push(`n=${state.a.runs}`);
  if (state.b.planningPct !== DEFAULTS.planningPct) parts.push(`p=${state.b.planningPct}`);
  if (state.b.targetHalfWidthPts !== DEFAULTS.targetHalfWidthPts) {
    parts.push(`w=${state.b.targetHalfWidthPts}`);
  }
  if (state.confidence !== DEFAULTS.confidence) parts.push(`c=${state.confidence}`);
  if (state.design !== DEFAULTS.design) parts.push(`d=${state.design}`);
  const r = Math.round(state.rho * 100);
  if (r !== 0) parts.push(`r=${r}`);
  if (state.design === "mixed" && state.runsPerPrompt !== DEFAULTS.runsPerPrompt) {
    parts.push(`k=${state.runsPerPrompt}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

function intInRange(v: string, lo: number, hi: number): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : undefined;
}

function numInRange(v: string, lo: number, hi: number): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined;
}

export function parse(params: URLSearchParams): { state: AppState; degraded: boolean } {
  let degraded = false;

  function pick<T>(
    key: string,
    fn: (v: string) => T | undefined,
    def: T,
  ): T {
    const raw = params.get(key);
    if (raw === null) return def; // absent: silent default
    const v = fn(raw);
    if (v === undefined) {
      degraded = true; // present but bad
      return def;
    }
    return v;
  }

  const mode = pick<Mode>("m", (v) => (v === "a" || v === "b" ? v : undefined), DEFAULTS.mode);
  let mentions = pick("x", (v) => intInRange(v, 0, N_MAX), DEFAULTS.mentions);
  const runs = pick("n", (v) => intInRange(v, 1, N_MAX), DEFAULTS.runs);
  const planningPct = pick("p", (v) => numInRange(v, 0, 100), DEFAULTS.planningPct);
  const targetHalfWidthPts = pick("w", (v) => numInRange(v, 0.5, 50), DEFAULTS.targetHalfWidthPts);
  const confidence = pick<ConfidenceLevel>(
    "c",
    (v) => {
      const n = Number(v);
      return isConfidenceLevel(n) ? n : undefined;
    },
    DEFAULTS.confidence,
  );
  const design = pick<Design>(
    "d",
    (v) => (v === "single" || v === "distinct" || v === "mixed" ? v : undefined),
    DEFAULTS.design,
  );
  const r = pick("r", (v) => intInRange(v, 0, 90), 0);
  const rho = r / 100;
  const runsPerPrompt = pick("k", (v) => intInRange(v, 1, N_MAX), DEFAULTS.runsPerPrompt);

  // Cross-field: an x that exceeds n is not a binomial outcome.
  if (mentions > runs) {
    mentions = DEFAULTS.mentions;
    degraded = true;
  }

  return {
    state: {
      mode,
      a: { mentions, runs },
      b: { planningPct, targetHalfWidthPts },
      confidence,
      design,
      rho,
      runsPerPrompt,
    },
    degraded,
  };
}
