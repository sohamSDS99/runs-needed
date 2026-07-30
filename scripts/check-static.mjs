// Guard 2 (ADR-1/ADR-2): the deployed artefact must be a pure static export.
// Fails the build if:
//   1. src/app/** contains a route handler (route.ts / route.tsx)
//   2. any file under src/ carries a "use server" directive
//   3. the built out/ directory contains a server artefact (*.func / *.nft.json)
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const violations = [];

function walk(dir, visit) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, visit);
    else visit(p);
  }
}

// 1. No route handlers under src/app.
walk("src/app", (p) => {
  const b = basename(p);
  if (b === "route.ts" || b === "route.tsx") {
    violations.push(`route handler is not allowed in a static export: ${p}`);
  }
});

// 2. No server-action directive anywhere under src.
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const USE_SERVER = /["']use server["']/;
walk("src", (p) => {
  if (!CODE.test(p)) return;
  if (USE_SERVER.test(readFileSync(p, "utf8"))) {
    violations.push(`"use server" directive is not allowed: ${p}`);
  }
});

// 3. No server artefacts in the build output.
walk("out", (p) => {
  const segs = p.split(/[\\/]/);
  if (segs.some((s) => s.endsWith(".func")) || p.endsWith(".nft.json")) {
    violations.push(`server artefact found in out/: ${p}`);
  }
});

if (violations.length > 0) {
  console.error("check-static FAILED — the export is not fully static:");
  for (const v of violations) console.error("  - " + v);
  process.exit(1);
}

console.log("check-static: OK (no route handlers, no 'use server', no server artefacts)");
process.exit(0);
