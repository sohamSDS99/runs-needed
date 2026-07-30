import { describe, it, expect } from "vitest";
import {
  roundHalfUp,
  formatPct,
  formatPts,
  formatInt,
  formatRho,
  formatOneDp,
} from "../src/lib/format";

describe("format", () => {
  it("roundHalfUp is floor(y + 0.5), half rounds up (not banker's)", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.49)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
  });

  it("formatPct matches the PRD §5.1 worked values", () => {
    expect(formatPct(0.16818032970623614)).toBe("16.8%");
    expect(formatPct(0.6873262302663417)).toBe("68.7%");
    expect(formatPct(0.2775327998628892)).toBe("27.8%");
    expect(formatPct(0)).toBe("0.0%");
    expect(formatPct(1)).toBe("100.0%");
  });

  it("formatPts renders one decimal place", () => {
    expect(formatPts(51.9146)).toBe("51.9");
    expect(formatPts(26.3916)).toBe("26.4");
  });

  it("formatInt uses en-US thousands separators", () => {
    expect(formatInt(66343)).toBe("66,343");
    expect(formatInt(1000)).toBe("1,000");
    expect(formatInt(42)).toBe("42");
  });

  it("formatRho keeps the trailing zero", () => {
    expect(formatRho(0.2)).toBe("0.20");
    expect(formatRho(0)).toBe("0.00");
    expect(formatRho(0.05)).toBe("0.05");
  });

  it("formatOneDp renders one decimal place", () => {
    expect(formatOneDp(4.6296)).toBe("4.6");
    expect(formatOneDp(4.629629629629629)).toBe("4.6");
  });
});
