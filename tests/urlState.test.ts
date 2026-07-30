import { describe, it, expect } from "vitest";
import { parse, serialise } from "../src/lib/urlState";
import type { AppState } from "../src/lib/appState";
import type { ConfidenceLevel, Design } from "../src/lib/stats";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONF: ConfidenceLevel[] = [80, 90, 95, 99];
const DESIGN: Design[] = ["single", "distinct", "mixed"];

// Generates valid states: x <= n, k <= n (and only varied for mixed), rho a
// multiple of 0.01, p/w to one decimal place — the domain serialise/parse cover.
function genState(rng: () => number): AppState {
  const runs = 1 + Math.floor(rng() * N_MAX_TEST);
  const mentions = Math.floor(rng() * (runs + 1));
  const planningPct = Math.round(rng() * 1000) / 10;
  const targetHalfWidthPts = Math.round((0.5 + rng() * 49.5) * 10) / 10;
  const confidence = CONF[Math.floor(rng() * CONF.length)] ?? 95;
  const design = DESIGN[Math.floor(rng() * DESIGN.length)] ?? "single";
  const rho = Math.floor(rng() * 91) / 100;
  const runsPerPrompt = design === "mixed" ? 1 + Math.floor(rng() * runs) : 10;
  return {
    mode: rng() < 0.5 ? "a" : "b",
    a: { mentions, runs },
    b: { planningPct, targetHalfWidthPts },
    confidence,
    design,
    rho,
    runsPerPrompt,
  };
}
const N_MAX_TEST = 200000;

describe("urlState", () => {
  it("AC1: 1000 seeded states round-trip through serialise -> parse", () => {
    const rng = mulberry32(0x5eed);
    for (let i = 0; i < 1000; i++) {
      const s = genState(rng);
      const rt = parse(new URLSearchParams(serialise(s))).state;
      expect(rt).toEqual(s);
    }
  });

  it("AC3: the three PRD §8.4 examples round-trip unchanged", () => {
    for (const url of [
      "x=21&n=50",
      "x=126&n=300&d=mixed&r=20&k=30",
      "m=b&p=42&w=2&c=99",
    ]) {
      const s1 = parse(new URLSearchParams(url)).state;
      const s2 = parse(new URLSearchParams(serialise(s1))).state;
      expect(s2, url).toEqual(s1);
    }
  });

  it("AC2: defaults serialise empty; degraded flags; canonical form", () => {
    const def = parse(new URLSearchParams("")).state;
    expect(serialise(def)).toBe("");
    expect(parse(new URLSearchParams("x=999&n=10")).degraded).toBe(true);
    expect(parse(new URLSearchParams("utm_source=x")).degraded).toBe(false);
    expect(serialise(parse(new URLSearchParams("x=21&n=50")).state)).toBe("?x=21&n=50");
  });
});
