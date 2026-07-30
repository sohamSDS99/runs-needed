import { describe, it, expect } from "vitest";
import fixtures from "../fixtures/fixtures.json";
import { interpretModeA, interpretModeB } from "../src/lib/interpret";
import type { InterpretedLine } from "../src/lib/interpret";
import {
  wilsonInterval,
  wilsonFromProportion,
  designEffect,
  effectiveSampleSize,
} from "../src/lib/stats";
import type { ConfidenceLevel } from "../src/lib/stats";
import {
  computeModeB,
  formToAppState,
  DEFAULT_FORM,
  type AppState,
  type FormState,
} from "../src/lib/appState";

const WIDTH = ["WIDTH_UNUSABLE", "WIDTH_DIRECTIONAL", "WIDTH_TRACKABLE", "WIDTH_TIGHT"];
const BUDGET = ["BUDGET_EASY", "BUDGET_REAL", "BUDGET_HEAVY", "BUDGET_UNREALISTIC"];
const DESIGN = ["DESIGN_SINGLE", "DESIGN_DISTINCT", "DESIGN_MIXED"];
const RHO = ["RHO_ZERO", "RHO_APPLIED"];

const cl = (c: number) => c as ConfidenceLevel;

function modeAState(x: number, n: number, conf: number): AppState {
  return {
    mode: "a",
    a: { mentions: x, runs: n },
    b: { planningPct: 42, targetHalfWidthPts: 5 },
    confidence: cl(conf),
    design: "single",
    rho: 0,
    runsPerPrompt: 10,
  };
}

// Every fixture state as (lines) for the cross-cutting AC3/AC4 checks.
function allStates(): InterpretedLine[][] {
  const out: InterpretedLine[][] = [];
  for (const c of fixtures.modeA) {
    out.push(interpretModeA(modeAState(c.x, c.n, c.conf), wilsonInterval(c.x, c.n, cl(c.conf)), 1));
  }
  for (const c of fixtures.designEffectA) {
    const D = designEffect(c.runsPerPrompt, c.rho);
    const interval = wilsonFromProportion(c.planningPct / 100, effectiveSampleSize(c.n, D), cl(c.conf));
    const state: AppState = {
      mode: "a",
      a: { mentions: Math.round((c.planningPct / 100) * c.n), runs: c.n },
      b: { planningPct: 42, targetHalfWidthPts: 5 },
      confidence: cl(c.conf),
      design: "mixed",
      rho: c.rho,
      runsPerPrompt: c.runsPerPrompt,
    };
    out.push(interpretModeA(state, interval, D));
  }
  for (const c of fixtures.modeB) {
    const form: FormState = {
      ...DEFAULT_FORM,
      mode: "b",
      planningPct: String(c.planningPct),
      targetHalfWidthPts: String(c.targetHalfWidthPts),
      confidence: cl(c.conf),
    };
    out.push(interpretModeB(formToAppState(form), computeModeB(form)));
  }
  return out;
}

describe("interpret", () => {
  it("AC1: every Mode A fixture yields its resultClass and exactly one width class", () => {
    for (const c of fixtures.modeA) {
      const keys = interpretModeA(
        modeAState(c.x, c.n, c.conf),
        wilsonInterval(c.x, c.n, cl(c.conf)),
        1,
      ).map((l) => l.key);
      expect(keys, c.id).toContain(c.resultClass);
      expect(keys.filter((k) => WIDTH.includes(k)).length, c.id).toBe(1);
    }
  });

  it("AC2: every Mode B fixture yields its resultClass and exactly one budget class", () => {
    for (const c of fixtures.modeB) {
      const form: FormState = {
        ...DEFAULT_FORM,
        mode: "b",
        planningPct: String(c.planningPct),
        targetHalfWidthPts: String(c.targetHalfWidthPts),
        confidence: cl(c.conf),
      };
      const keys = interpretModeB(formToAppState(form), computeModeB(form)).map((l) => l.key);
      expect(keys, c.id).toContain(c.resultClass);
      expect(keys.filter((k) => BUDGET.includes(k)).length, c.id).toBe(1);
    }
  });

  it("AC3: no rendered line contains an unreplaced token", () => {
    for (const lines of allStates()) {
      for (const l of lines) expect(l.text, l.key).not.toContain("{");
    }
  });

  it("AC4: last line is GLOBAL_LOWER_BOUND; exactly one design + one rho note (56 states)", () => {
    const states = allStates();
    expect(states.length).toBe(56);
    for (const lines of states) {
      const keys = lines.map((l) => l.key);
      expect(keys[keys.length - 1]).toBe("GLOBAL_LOWER_BOUND");
      expect(keys.filter((k) => DESIGN.includes(k)).length).toBe(1);
      expect(keys.filter((k) => RHO.includes(k)).length).toBe(1);
    }
  });
});
