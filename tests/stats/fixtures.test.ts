import { describe, it, expect } from "vitest";
import fixtures from "../../fixtures/fixtures.json";
import {
  wilsonInterval,
  wilsonFromProportion,
  wilsonHalfWidth,
} from "../../src/lib/stats/wilson";
import { requiredRuns, requiredRunsAdjusted } from "../../src/lib/stats/sampleSize";
import { designEffect, effectiveSampleSize } from "../../src/lib/stats/designEffect";
import { validateModeA, validateModeB } from "../../src/lib/stats/validate";
import type { ConfidenceLevel } from "../../src/lib/stats/z";

// Tolerances are the ones declared in fixtures.json.
const PROP = 1e-12; // proportions: lower, upper, halfWidth, effectiveN, designEffect
const WIDTH = 1e-10; // widthPts (an extra ×100 of floating error)

const cl = (c: number) => c as ConfidenceLevel;
const near = (a: number, b: number, t: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(t);

describe("fixture counts (guards against a truncated fixtures.json)", () => {
  it("has exactly 30 / 20 / 6 / 3 / 15 cases", () => {
    expect(fixtures.modeA.length).toBe(30);
    expect(fixtures.modeB.length).toBe(20);
    expect(fixtures.designEffectA.length).toBe(6);
    expect(fixtures.designEffectB.length).toBe(3);
    expect(fixtures.rejects.length).toBe(15);
  });
});

describe("modeA", () => {
  for (const c of fixtures.modeA) {
    it(`${c.id} (x=${c.x}, n=${c.n}, ${c.conf}%)`, () => {
      const r = wilsonInterval(c.x, c.n, cl(c.conf));
      near(r.lower, c.lo, PROP);
      near(r.upper, c.hi, PROP);
      near(r.halfWidth, c.halfWidth, PROP);
      near(r.widthPts, c.widthPts, WIDTH);
      if (c.x === 0) expect(r.lower).toBe(0);
      if (c.x === c.n) expect(r.upper).toBe(1);
    });
  }
});

describe("modeB", () => {
  for (const c of fixtures.modeB) {
    it(`${c.id} (p=${c.planningPct}, w=${c.targetHalfWidthPts}, ${c.conf}%)`, () => {
      const p = c.planningPct / 100;
      const w = c.targetHalfWidthPts / 100;
      const n = requiredRuns(p, w, cl(c.conf));
      expect(n).toBe(c.requiredRuns); // exact — no tolerance
      near(wilsonHalfWidth(p, n, cl(c.conf)), c.halfWidthAtN, PROP);
      if (c.halfWidthAtNMinus1 !== null) {
        near(wilsonHalfWidth(p, n - 1, cl(c.conf)), c.halfWidthAtNMinus1, PROP);
      } else {
        expect(n).toBe(1); // half-width at n-1 is only null when n* = 1
      }
    });
  }
});

describe("designEffectA", () => {
  for (const c of fixtures.designEffectA) {
    it(`${c.id} (n=${c.n}, rho=${c.rho}, R=${c.runsPerPrompt})`, () => {
      const D = designEffect(c.runsPerPrompt, c.rho);
      const nEff = effectiveSampleSize(c.n, D);
      near(D, c.designEffect, PROP);
      near(nEff, c.effectiveN, PROP);
      const r = wilsonFromProportion(c.planningPct / 100, nEff, cl(c.conf));
      near(r.lower, c.lo, PROP);
      near(r.upper, c.hi, PROP);
      near(r.halfWidth, c.halfWidth, PROP);
      near(r.widthPts, c.widthPts, WIDTH);
    });
  }
});

describe("designEffectB", () => {
  for (const c of fixtures.designEffectB) {
    it(`${c.id} (rho=${c.rho}, R=${c.runsPerPrompt})`, () => {
      const D = designEffect(c.runsPerPrompt, c.rho);
      near(D, c.designEffect, PROP);
      const { baseRuns, requiredRuns: req } = requiredRunsAdjusted(
        c.planningPct / 100,
        c.targetHalfWidthPts / 100,
        cl(c.conf),
        D,
      );
      expect(baseRuns).toBe(c.baseRuns);
      expect(req).toBe(c.requiredRuns);
    });
  }
});

describe("rejects", () => {
  for (const c of fixtures.rejects) {
    it(`${c.id} -> ${c.errorCode}`, () => {
      const got =
        c.mode === "A"
          ? validateModeA(c.input as never)
          : validateModeB(c.input as never);
      expect(got).toBe(c.errorCode);
    });
  }
});
