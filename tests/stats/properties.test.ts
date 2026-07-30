import { describe, it, expect } from "vitest";
import { wilsonInterval, wilsonHalfWidth } from "../../src/lib/stats/wilson";
import { requiredRuns } from "../../src/lib/stats/sampleSize";
import { CONFIDENCE_LEVELS } from "../../src/lib/stats/z";
import type { ConfidenceLevel } from "../../src/lib/stats/z";

// Deterministic PRNG (mulberry32), seeded with the literal 0x5eed so every run
// is bit-for-bit reproducible — no test dependency.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEVELS = CONFIDENCE_LEVELS;
const pick = (r: number): ConfidenceLevel =>
  LEVELS[Math.floor(r * LEVELS.length)] ?? 95;

describe("properties", () => {
  it("containment: 0 <= lower <= p-hat <= upper <= 1 (1000 cases)", () => {
    const rng = mulberry32(0x5eed);
    const EPS = 1e-12;
    for (let i = 0; i < 1000; i++) {
      const n = 1 + Math.floor(rng() * 5000); // 1..5000
      const x = Math.floor(rng() * (n + 1)); // 0..n
      const conf = pick(rng());
      const r = wilsonInterval(x, n, conf);
      const pHat = x / n;
      expect(r.lower).toBeGreaterThanOrEqual(0);
      expect(r.upper).toBeLessThanOrEqual(1);
      expect(r.lower).toBeLessThanOrEqual(pHat + EPS);
      expect(r.upper).toBeGreaterThanOrEqual(pHat - EPS);
    }
  });

  it("boundary snapping: x=0 => lower===0, x=n => upper===1 (n=1..200, all levels)", () => {
    for (let n = 1; n <= 200; n++) {
      for (const conf of LEVELS) {
        expect(wilsonInterval(0, n, conf).lower).toBe(0);
        expect(wilsonInterval(n, n, conf).upper).toBe(1);
      }
    }
  });

  it("monotonicity: half-width strictly decreasing in n (n=1..5000)", () => {
    const ps = [0, 0.05, 0.42, 0.5, 0.97, 1];
    let violations = 0;
    let firstBad = "";
    for (const p of ps) {
      for (const conf of LEVELS) {
        let prev = wilsonHalfWidth(p, 1, conf);
        for (let n = 2; n <= 5000; n++) {
          const h = wilsonHalfWidth(p, n, conf);
          if (!(h < prev)) {
            violations++;
            if (!firstBad) firstBad = `p=${p} conf=${conf} n=${n} h=${h} prev=${prev}`;
          }
          prev = h;
        }
      }
    }
    expect(violations, firstBad).toBe(0);
  });

  it("minimality: h(n*)<=w and h(n*-1)>w where n*>1 (500 cases)", () => {
    const rng = mulberry32(0x5eed);
    for (let i = 0; i < 500; i++) {
      const p = rng();
      const w = 0.005 + rng() * (0.5 - 0.005); // [0.005, 0.5]
      const conf = pick(rng());
      const nStar = requiredRuns(p, w, conf);
      expect(wilsonHalfWidth(p, nStar, conf)).toBeLessThanOrEqual(w);
      if (nStar > 1) {
        expect(wilsonHalfWidth(p, nStar - 1, conf)).toBeGreaterThan(w);
      }
    }
  });
});
