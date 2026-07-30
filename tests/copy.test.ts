import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { COPY } from "../src/lib/copy";

// Reads PRD.md at runtime (never embeds a copy of it) and asserts every
// normative §5 string survives verbatim into copy.ts. PRD §5 is the source of
// truth; this fails the build on any drift.
const lines = readFileSync("PRD.md", "utf8").split("\n");
const at = (re: RegExp) => lines.findIndex((l) => re.test(l));
const s53 = at(/^###\s*5\.3\b/);
const s511 = at(/^###\s*5\.11\b/);
const s6 = at(/^##\s*6\b/);

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function expectedStrings(): string[] {
  const out: string[] = [];
  // §5.3–§5.10: blockquote lines.
  for (let i = s53; i < s511; i++) {
    const m = lines[i]?.match(/^>\s?(.*\S)\s*$/);
    if (m?.[1]) out.push(m[1]);
  }
  // §5.11: the String column of the validation-message table.
  for (let i = s511; i < s6; i++) {
    const m = lines[i]?.match(/^\|\s*`[A-Z_]+`\s*\|\s*(.*?)\s*\|\s*$/);
    if (m?.[1]) out.push(m[1]);
  }
  return out;
}

describe("copy integrity", () => {
  const expected = expectedStrings();
  const haystack = norm(Object.values(COPY).join("\n"));

  it("locates the §5 section markers", () => {
    expect(s53).toBeGreaterThan(-1);
    expect(s511).toBeGreaterThan(s53);
    expect(s6).toBeGreaterThan(s511);
  });

  it("extracts the expected number of copy strings from the PRD", () => {
    expect(expected.length).toBeGreaterThanOrEqual(30);
  });

  it("every PRD §5 copy string appears verbatim in copy.ts", () => {
    for (const e of expected) {
      expect(haystack, `missing from copy.ts: ${e}`).toContain(norm(e));
    }
  });
});
