// Bundle-budget gate (PRD §9.2). Sums the gzipped size of the client chunks
// the "/" route loads and fails the build if JS exceeds 120 KB or CSS 15 KB.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const MANIFEST = ".next/app-build-manifest.json";
const JS_BUDGET = 122880; // 120 KB
const CSS_BUDGET = 15360; // 15 KB

if (!existsSync(MANIFEST)) {
  console.error(`check-bundle: ${MANIFEST} not found — run \`next build\` first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const pages = manifest.pages ?? {};

// The chunks that render "/" are those referenced by the root page and the
// root layout. Union + dedupe so shared chunks are counted once.
const routeKeys = Object.keys(pages).filter(
  (k) => k === "/page" || k === "/layout" || k === "/",
);
if (routeKeys.length === 0) {
  console.error("check-bundle: no '/' route entry in the manifest.");
  process.exit(1);
}
const chunks = new Set();
for (const k of routeKeys) for (const c of pages[k] ?? []) chunks.add(c);

let jsBytes = 0;
let cssBytes = 0;
for (const chunk of chunks) {
  const p = join(".next", chunk);
  if (!existsSync(p)) continue;
  const gz = gzipSync(readFileSync(p)).length;
  if (chunk.endsWith(".js")) jsBytes += gz;
  else if (chunk.endsWith(".css")) cssBytes += gz;
}

console.log(`JS  (gzipped): ${jsBytes} bytes  (budget ${JS_BUDGET})`);
console.log(`CSS (gzipped): ${cssBytes} bytes  (budget ${CSS_BUDGET})`);

let over = false;
if (jsBytes > JS_BUDGET) {
  console.error(`check-bundle FAILED: JS ${jsBytes} > ${JS_BUDGET}`);
  over = true;
}
if (cssBytes > CSS_BUDGET) {
  console.error(`check-bundle FAILED: CSS ${cssBytes} > ${CSS_BUDGET}`);
  over = true;
}
process.exit(over ? 1 : 0);
