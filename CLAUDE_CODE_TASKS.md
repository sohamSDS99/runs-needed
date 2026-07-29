# Claude Code Task Sequence

26 atomic tasks, each sized for one Claude Code session. **Execute in numerical order.** The dependency column is advisory; the numbering is authoritative.

**Non-negotiable ordering property:** tasks T03–T10 complete the statistics core and its verification. **No file under `src/app/` or `src/components/` may exist before T11.** If a task earlier than T11 produces a React component, that is a defect — revert it. The reason is in PRD ADR-4: the core has to be provably standalone, and the only way to prove that is to write and test it before anything can import it.

**How to read the acceptance criteria.** Every criterion is a shell command with an expected exit code or an expected substring in stdout. There is no criterion in this document that requires a human to look at something and form an opinion. Run them; if they pass, the task is done.

**Reference documents, all in the repository root:** `PRD.md` (product spec; §5 is the normative source for all user-facing copy), `STATS_SPEC.md` (formulas), `TEST_FIXTURES.md` and `fixtures/fixtures.json` (expected values).

---

## T01 — Repository scaffold and tooling

**Build.** Next.js 15 project, App Router, TypeScript strict, Tailwind v4, Vitest, Playwright, ESLint. `output: 'export'` in the Next config. Scripts in `package.json`: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `verify`. `verify` runs, in order: `typecheck`, `lint`, `test`, `build`, `node scripts/check-bundle.mjs`, `test:e2e`.

`tsconfig.json` must set `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `exactOptionalPropertyTypes: true`, and `resolveJsonModule: true` (the test suite imports `fixtures.json`).

Create `scripts/check-static.mjs` and `scripts/check-bundle.mjs` now as **stubs that print a line and exit 0**, so `verify` is wired end to end from this task onward. T02 implements `check-static.mjs`; T10 implements `check-bundle.mjs`. A stub is correct here; a missing file would make every intermediate task's `verify` fail for an unrelated reason.

**Files touched.** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.nvmrc`, `src/app/globals.css`, `scripts/check-static.mjs`, `scripts/check-bundle.mjs`

**Acceptance.**
1. `npm ci` exits 0.
2. `npm run typecheck` exits 0.
3. `npm run lint` exits 0.
4. `node -e "const c=require('fs').readFileSync('next.config.ts','utf8'); process.exit(/output:\s*['\"]export['\"]/.test(c)?0:1)"` exits 0.
5. `node -e "const p=require('./package.json'); const s=p.scripts.verify; process.exit(['typecheck','lint','test','build','check-bundle','test:e2e'].every(k=>s.includes(k))?0:1)"` exits 0.
6. `node -e "const p=require('./package.json'); const d=Object.keys(p.dependencies||{}); process.exit(d.every(x=>['next','react','react-dom','@vercel/analytics'].includes(x))?0:1)"` exits 0 — runtime dependencies are limited to that list.

**Dependencies.** None.

---

## T02 — Constraint guardrails that fail the build

**Build.** Three mechanical guards.

1. ESLint `no-restricted-imports` configured so any import inside `src/lib/stats/**` whose specifier does not start with `./` or `../` **within that directory** is an error. Practically: patterns `react`, `react-dom`, `next/*`, `@/*`, `../*` are all forbidden inside `src/lib/stats/`.
2. `scripts/check-static.mjs` — fails if `src/app/**` contains any file named `route.ts`/`route.tsx`, if any file under `src/` contains the string `"use server"`, or if the `out/` directory after a build contains a `.func` or `.nft.json` entry.
3. ESLint rule forbidding any call expression `track(` with one or more arguments (PRD ADR-6). Implement with `no-restricted-syntax`, selector `CallExpression[callee.name='track'][arguments.length>0]`.

Wire `check-static.mjs` into `verify` immediately after `build`.

**Files touched.** `eslint.config.mjs`, `scripts/check-static.mjs`, `package.json`

**Acceptance.**
1. `mkdir -p src/lib/stats && printf "import React from 'react';\nexport const a=1;\n" > src/lib/stats/__probe.ts && npm run lint; echo $?` prints a non-zero code; then `rm src/lib/stats/__probe.ts`.
2. `mkdir -p src/app/api/x && printf "export function GET(){return new Response('x')}\n" > src/app/api/x/route.ts && node scripts/check-static.mjs; echo $?` prints a non-zero code; then `rm -rf src/app/api`.
3. `printf "declare function track(a:unknown):void;\ntrack({x:1});\n" > src/__probe.ts && npm run lint; echo $?` prints a non-zero code; then `rm src/__probe.ts`.
4. `npm run lint` exits 0 with the probes removed.

**Dependencies.** T01.

---

## T03 — `stats/z.ts`: confidence levels and z constants

**Build.** Export `type ConfidenceLevel = 80 | 90 | 95 | 99`, a frozen record `Z_VALUES: Record<ConfidenceLevel, number>` with the four literals from `STATS_SPEC.md` §2 copied to all 16 significant figures, an `isConfidenceLevel(v: unknown): v is ConfidenceLevel` type guard, and `CONFIDENCE_LEVELS: readonly ConfidenceLevel[]` in ascending order. No other exports. No quantile function.

**Files touched.** `src/lib/stats/z.ts`

**Acceptance.**
1. `npm run typecheck` exits 0.
2. `npx tsx -e "import {Z_VALUES} from './src/lib/stats/z';const e={80:1.2815515655446004,90:1.6448536269514722,95:1.959963984540054,99:2.5758293035489004};for(const k of [80,90,95,99]){if(Z_VALUES[k]!==e[k])process.exit(1)}console.log('ok')"` prints `ok`.
3. `node -e "const s=require('fs').readFileSync('src/lib/stats/z.ts','utf8');process.exit(/import|require\(/.test(s)?1:0)"` exits 0 — the file contains no imports.

**Dependencies.** T02.

---

## T04 — `stats/wilson.ts`: the interval

**Build.** Per `STATS_SPEC.md` §3.1 and §3.3.

```ts
export interface WilsonInterval { lower: number; upper: number; centre: number; halfWidth: number; widthPts: number; }
export function wilsonFromProportion(pHat: number, n: number, confidence: ConfidenceLevel): WilsonInterval;
export function wilsonInterval(successes: number, trials: number, confidence: ConfidenceLevel): WilsonInterval;
export function wilsonHalfWidth(pHat: number, n: number, confidence: ConfidenceLevel): number;
```

`n` is typed `number`, not `number & Integer` — `wilsonFromProportion` must accept non-integer `n`, because that is how the design effect is applied (PRD §8.1, `STATS_SPEC.md` §5.2). Apply snap-then-clamp exactly as written in `STATS_SPEC.md` §3.3: snap on `pHat <= 0` and `pHat >= 1` **before** clamping, because the spurious floating-point value is positive and clamping alone will not remove it. `widthPts` is `(upper − lower) * 100`, unrounded — rounding belongs to `format.ts`, not here.

These functions assume valid input; they do not validate. Validation is T07.

**Files touched.** `src/lib/stats/wilson.ts`

**Acceptance.**
1. `npm run typecheck` and `npm run lint` exit 0.
2. `npx tsx -e "import {wilsonInterval as w} from './src/lib/stats/wilson';const r=w(4,10,95);if(Math.abs(r.lower-0.16818032970623614)>1e-12||Math.abs(r.upper-0.6873262302663417)>1e-12)process.exit(1);if(w(0,10,95).lower!==0||w(10,10,95).upper!==1)process.exit(1);console.log('ok')"` prints `ok`.
3. `npx tsx -e "import {wilsonFromProportion as w} from './src/lib/stats/wilson';const r=w(0.42,4.629629629629629,95);if(Math.abs(r.lower-0.12193)>1e-4)process.exit(1);console.log('ok')"` prints `ok` — non-integer `n` accepted.
4. `node -e "const s=require('fs').readFileSync('src/lib/stats/wilson.ts','utf8');process.exit(/from ['\"](?!\.\/)/.test(s)?1:0)"` exits 0 — the only imports are relative to this directory.

**Dependencies.** T03.

---

## T05 — `stats/designEffect.ts`

**Build.** Per `STATS_SPEC.md` §5.2.

```ts
export type Design = 'single' | 'distinct' | 'mixed';
export function designEffect(runsPerPrompt: number, rho: number): number;   // 1 + (R-1)*rho
export function effectiveSampleSize(n: number, D: number): number;          // n / D
export const RHO_PRESETS: readonly number[];                                // [0, 0.05, 0.1, 0.2]
export const RHO_MAX = 0.9;
```

`designEffect` returns exactly `1` when `rho === 0` for any `runsPerPrompt`, so the unadjusted path is the same code path (fixture `D05`).

**Files touched.** `src/lib/stats/designEffect.ts`

**Acceptance.**
1. `npx tsx -e "import {designEffect as d,effectiveSampleSize as e} from './src/lib/stats/designEffect';if(d(50,0)!==1||d(1,0.5)!==1)process.exit(1);if(Math.abs(d(50,0.2)-10.8)>1e-12)process.exit(1);if(Math.abs(e(50,10.8)-4.62962962962963)>1e-12)process.exit(1);console.log('ok')"` prints `ok`.
2. `npm run typecheck` and `npm run lint` exit 0.

**Dependencies.** T04.

---

## T06 — `stats/sampleSize.ts`: required runs

**Build.** Per `STATS_SPEC.md` §4.1.

```ts
export function requiredRuns(planningProportion: number, targetHalfWidth: number, confidence: ConfidenceLevel): number;
export function requiredRunsAdjusted(planningProportion: number, targetHalfWidth: number, confidence: ConfidenceLevel, designEffectValue: number): { baseRuns: number; requiredRuns: number };
export function upperBoundRuns(targetUpperBound: number, confidence: ConfidenceLevel): number;
```

`requiredRuns` uses exponential bracketing then binary search, exactly as written in `STATS_SPEC.md` §4.1. It must **not** use the Wald closed form. It must never evaluate the half-width at `round(p*n)/n` — always at the continuous `p`. Hard-cap the bracketing at `2**31` and throw a plain `Error` if exceeded (unreachable for inputs in range; the cap exists so a bug cannot hang the browser).

`requiredRunsAdjusted` returns `{ baseRuns, requiredRuns: Math.ceil(baseRuns * designEffectValue) }`.

`upperBoundRuns` implements `n = floor(z²(1−U)/U) + 1` from `STATS_SPEC.md` §4.3 — used for the two constants in the `ZERO_MENTIONS` copy string.

**Files touched.** `src/lib/stats/sampleSize.ts`

**Acceptance.**
1. `npx tsx -e "import {requiredRuns as r,upperBoundRuns as u} from './src/lib/stats/sampleSize';const c=[[0.5,0.05,95,381],[0.05,0.05,95,83],[0,0.1,95,16],[1,0.1,95,16],[0.5,0.5,95,1],[0.5,0.005,99,66343]];for(const [p,w,cf,x] of c){if(r(p,w,cf)!==x){console.error(p,w,cf,r(p,w,cf),x);process.exit(1)}}if(u(0.05,95)!==73||u(0.01,95)!==381)process.exit(1);console.log('ok')"` prints `ok`.
2. `node -e "const s=require('fs').readFileSync('src/lib/stats/sampleSize.ts','utf8');process.exit(/Math\.round\(|\/\s*\(?\s*w\s*\*\s*w/.test(s)?1:0)"` exits 0 — no rounding of `p*n`, no Wald closed form.
3. `npm run typecheck` and `npm run lint` exit 0.

**Dependencies.** T05.

---

## T07 — `stats/validate.ts` and `stats/index.ts`

**Build.** Error codes and validation in the exact order given in PRD §4.2 and §4.3. Return the **first** failure only.

```ts
export type ErrorCode = 'X_NOT_INTEGER' | 'N_NOT_INTEGER' | 'X_NEGATIVE' | 'N_BELOW_MIN'
  | 'N_ABOVE_MAX' | 'X_EXCEEDS_N' | 'CONF_NOT_ALLOWED' | 'RHO_OUT_OF_RANGE'
  | 'RUNS_PER_PROMPT_BELOW_MIN' | 'RUNS_PER_PROMPT_EXCEEDS_N'
  | 'PLANNING_OUT_OF_RANGE' | 'TARGET_BELOW_MIN' | 'TARGET_ABOVE_MAX';

export const N_MAX = 200000;
export const TARGET_MIN_PTS = 0.5;
export const TARGET_MAX_PTS = 50;

export function validateModeA(i: ModeAInput): ErrorCode | null;
export function validateModeB(i: ModeBInput): ErrorCode | null;
```

`index.ts` re-exports the public surface of the five modules and contains **no logic** — no function declarations, no arithmetic.

**Files touched.** `src/lib/stats/validate.ts`, `src/lib/stats/index.ts`

**Acceptance.**
1. `npx tsx -e "import f from './fixtures/fixtures.json';import {validateModeA as a,validateModeB as b} from './src/lib/stats/validate';let bad=0;for(const r of f.rejects){const g=r.mode==='A'?a(r.input as never):b(r.input as never);if(g!==r.errorCode){console.error(r.id,g,r.errorCode);bad++}}process.exit(bad?1:0)"` exits 0 — all 15 reject fixtures produce their exact code.
2. `npx tsx -e "import {validateModeA as a} from './src/lib/stats/validate';if(a({mentions:4,runs:10,confidence:95,rho:0,design:'single',runsPerPrompt:10})!==null)process.exit(1);console.log('ok')"` prints `ok`.
3. `node -e "const s=require('fs').readFileSync('src/lib/stats/index.ts','utf8');process.exit(/function |=>|[-+*/]=/.test(s)?1:0)"` exits 0 — `index.ts` is re-exports only.
4. `npm run typecheck` and `npm run lint` exit 0.

**Dependencies.** T06.

---

## T08 — Fixture conformance test suite

**Build.** `tests/stats/fixtures.test.ts`, importing `fixtures/fixtures.json` directly — never a copy of the values. Four `describe` blocks:

- `modeA`: for each of the 30 cases, assert `lower`, `upper`, `halfWidth` within `1e-12` and `widthPts` within `1e-10`; additionally assert `lower === 0` exactly where `x === 0` and `upper === 1` exactly where `x === n`.
- `modeB`: for each of the 20 cases, assert `requiredRuns` matches **exactly**, and assert `halfWidthAtN` and `halfWidthAtNMinus1` within `1e-12` (skipping the latter where it is `null`).
- `designEffectA` / `designEffectB`: the 6 and 3 cases, same tolerances; assert `designEffect` and `effectiveN`.
- `rejects`: the 15 cases (may duplicate T07's check; keep both — this one is the regression guard).

The test must fail if the fixture file has fewer cases than expected, so hard-assert the counts 30 / 20 / 6 / 3 / 15.

**Files touched.** `tests/stats/fixtures.test.ts`

**Acceptance.**
1. `npm test` exits 0.
2. `npx vitest run tests/stats/fixtures.test.ts --reporter=json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);process.exit(r.numTotalTests>=74&&r.numFailedTests===0?0:1)})"` exits 0 — at least 74 assertions-as-tests, none failing.
3. Mutation check: `python3 - <<'P'` replacing `1.959963984540054` with `1.96` in `src/lib/stats/z.ts`, then `npm test` must exit non-zero, then restore. Script this in the session and confirm both states.

**Dependencies.** T07.

---

## T09 — Property tests

**Build.** `tests/stats/properties.test.ts`. A deterministic pseudo-random generator seeded with the literal `0x5eed` (implement a 6-line mulberry32 inline — no dependency). Four properties:

1. **Containment**, 1,000 random `(x, n, confidence)` with `1 ≤ n ≤ 5000`, `0 ≤ x ≤ n`: `0 ≤ lower ≤ x/n ≤ upper ≤ 1`.
2. **Boundary snapping**, all `n` in `1…200` at all four levels: `x = 0` ⇒ `lower === 0`; `x = n` ⇒ `upper === 1`.
3. **Monotonicity**, for `p` in `{0, 0.05, 0.42, 0.5, 0.97, 1}` × four levels, `n = 1…5000`: half-width strictly decreasing in `n`.
4. **Minimality**, 500 random `(p, w, confidence)` with `w` in `[0.005, 0.5]`: `halfWidth(n*) ≤ w` and, where `n* > 1`, `halfWidth(n* − 1) > w`.

**Files touched.** `tests/stats/properties.test.ts`

**Acceptance.**
1. `npm test` exits 0.
2. `npm test 2>&1 | grep -c "properties"` prints a value of at least 1.
3. Determinism: `npm test 2>&1 | tail -5 > /tmp/r1 && npm test 2>&1 | tail -5 > /tmp/r2 && diff /tmp/r1 /tmp/r2` exits 0.
4. Mutation check: change snap-then-clamp in `wilson.ts` to clamp-only (`Math.max(0, centre - half)` with no `pHat <= 0` branch); `npm test` must exit non-zero; restore.

**Dependencies.** T08.

---

## T10 — Independent verifiers and the bundle-budget script

**Build.** Confirm `scripts/verify_fixtures.py`, `scripts/verify_fixtures.R`, `scripts/coverage.py`, and `scripts/monotonicity.py` run against the committed fixtures — these four files already exist in the repository and must not be modified. Then write `scripts/check-bundle.mjs`: parse `.next/app-build-manifest.json`, resolve the client chunks referenced by the `/` route, gzip each with `zlib.gzipSync` at default level, sum the JS bytes and the CSS bytes, print both, and exit 1 if JS exceeds 122,880 bytes or CSS exceeds 15,360 bytes.

Add a second CI job in `.github/workflows/ci.yml` that installs Python 3.11 with SciPy and statsmodels and runs `scripts/verify_fixtures.py`.

**Files touched.** `scripts/check-bundle.mjs`, `.github/workflows/ci.yml`

**Acceptance.**
1. `python3 scripts/verify_fixtures.py | grep -q "PASS - every fixture reproduced"` exits 0.
2. `python3 scripts/verify_fixtures.py | grep -q "assertions run: 457"` exits 0.
3. `python3 scripts/monotonicity.py | grep -q "^PASS"` exits 0.
4. `python3 scripts/coverage.py | grep -q "0.0955"` exits 0.
5. `git diff --exit-code scripts/verify_fixtures.py scripts/verify_fixtures.R scripts/coverage.py scripts/monotonicity.py` exits 0 — the verifiers were not edited to make anything pass.
6. `npm run build && node scripts/check-bundle.mjs` exits 0 and prints two byte counts.

**Dependencies.** T09. **This is the last task before any UI exists.**

---

## T11 — `format.ts`

**Build.** Pure formatting, no imports from `stats/` other than types.

```ts
export function roundHalfUp(y: number): number;              // Math.floor(y + 0.5)
export function formatPct(proportion: number): string;       // 0.168180 -> "16.8%"
export function formatPts(points: number): string;           // 51.9146  -> "51.9"
export function formatInt(v: number): string;                // 66343    -> "66,343"
export function formatRho(rho: number): string;              // 0.2      -> "0.20"
export function formatOneDp(v: number): string;              // 4.6296   -> "4.6"
```

`formatPct` is `roundHalfUp(proportion * 1000) / 10` then `.toFixed(1)` then `+ '%'`. Not `Math.round`, not `toFixed` alone — the exact expression matters and is specified in PRD §5.1. `formatInt` uses `Intl.NumberFormat('en-US')`.

**Files touched.** `src/lib/format.ts`, `tests/format.test.ts`

**Acceptance.**
1. `npx tsx -e "import {formatPct as p,formatPts as t,formatInt as i,formatRho as r} from './src/lib/format';const c=[[p(0.16818032970623614),'16.8%'],[p(0.6873262302663417),'68.7%'],[p(0.2775327998628892),'27.8%'],[p(0),'0.0%'],[p(1),'100.0%'],[t(51.9146),'51.9'],[t(26.3916),'26.4'],[i(66343),'66,343'],[r(0.2),'0.20'],[r(0),'0.00']];for(const [g,w] of c){if(g!==w){console.error(g,w);process.exit(1)}}console.log('ok')"` prints `ok`.
2. `npm test` exits 0 and `tests/format.test.ts` contains at least 10 assertions.

**Dependencies.** T10.

---

## T12 — `brand.ts`, root layout, page shell

**Build.** `src/lib/brand.ts` exporting `NAME = 'Runs Needed'`, `TITLE`, `DESCRIPTION`, `CANONICAL_BASE = 'https://runs-needed.vercel.app'`, exactly as specified in the PRD preamble. `src/app/layout.tsx` with `metadata` built from those constants, `lang="en"`, the CSP meta tag from PRD §9.4, and the Tailwind base styles. `src/app/page.tsx` rendering the static shell of PRD §6.1 items 1, 8, and 10 only — wordmark, `h1`, method link, footer. No inputs and no result region yet.

Also create `src/app/not-found.tsx` (a 404 with the wordmark and a link to `/`, no calculator) and `src/app/opengraph-image.tsx` as a **build-time static** Open Graph image — these two are listed in PRD §8.1 and are created here, not later. `opengraph-image.tsx` must not import anything from `src/lib/stats/` or `src/lib/card.ts`; it is one fixed image for the whole site, and the per-result card is T25.

**Files touched.** `src/lib/brand.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`, `src/app/opengraph-image.tsx`

**Acceptance.**
1. `npm run build` exits 0.
2. `npm run build && grep -qi "confidence interval" out/index.html` exits 0.
3. `node -e "const s=require('fs').readFileSync('out/index.html','utf8');process.exit(/<h1[^>]*>/.test(s)&&(s.match(/<h1/g)||[]).length===1?0:1)"` exits 0 — exactly one `h1`.
4. `node scripts/check-static.mjs` exits 0.
5. `npm run build && test -f out/404.html && test -f out/opengraph-image.png` exits 0 — some Next.js versions emit `opengraph-image.jpg`; accept either extension.

**Dependencies.** T11.

---

## T13 — Input components

**Build.** `NumberField` (label always visible, `type="number"`, `inputMode="numeric"`, `aria-invalid`, `aria-describedby` wired to an error element), `ConfidenceSelect` (four options from `CONFIDENCE_LEVELS`), `DesignRadio` (three options, real `radiogroup` semantics), `AdvancedDisclosure` (`<details>` containing a ρ field with the four preset buttons and the runs-per-prompt field, the latter rendered only when design is `mixed`, and open by default when design is `mixed`).

**Files touched.** `src/components/NumberField.tsx`, `src/components/ConfidenceSelect.tsx`, `src/components/DesignRadio.tsx`, `src/components/AdvancedDisclosure.tsx`

**Acceptance.**
1. `npm run typecheck` and `npm run lint` exit 0.
2. `node -e "const fs=require('fs');const f=['NumberField','ConfidenceSelect','DesignRadio','AdvancedDisclosure'];process.exit(f.every(n=>fs.existsSync('src/components/'+n+'.tsx'))?0:1)"` exits 0.
3. `node -e "const s=require('fs').readFileSync('src/components/NumberField.tsx','utf8');process.exit(s.includes('placeholder=')?1:0)"` exits 0 — no in-field hint used in place of a label (PRD §6.2).

**Dependencies.** T12.

---

## T14 — `IntervalBar`

**Build.** Per PRD §6.4. A 0–100% track, the interval as a filled band (`blue-600` at 20% opacity with a full-opacity 2px border), the point estimate as a 2px tick, axis ticks at 0/25/50/75/100 reducing to 0/50/100 below `640px`. `aria-hidden="true"` on the whole graphic. Width transition disabled under `prefers-reduced-motion`.

**Files touched.** `src/components/IntervalBar.tsx`

**Acceptance.**
1. `npm run typecheck` and `npm run lint` exit 0.
2. `node -e "const s=require('fs').readFileSync('src/components/IntervalBar.tsx','utf8');process.exit(s.includes('aria-hidden')&&s.includes('motion-reduce')?0:1)"` exits 0.

**Dependencies.** T13.

---

## T15 — `ResultPanel` and Mode A wiring

**Build.** `useReducer` holding `AppState` exactly as typed in PRD §8.2, with the PRD §4 defaults. `ResultPanel` renders PRD §6.3 reading order: the interval as the largest text, the secondary line, the bar, and the `sr-only` `<dl>` from PRD §9.1 verbatim. Region gets `aria-live="polite"`, `role="region"`, `aria-label="Result"`. Invalid state dims the previous result to 40% opacity with `aria-busy="true"` and shows the field error — it must not clear the result.

**Files touched.** `src/components/ResultPanel.tsx`, `src/app/page.tsx`

**Acceptance.**
1. `npm run build && node -e "const s=require('fs').readFileSync('out/index.html','utf8');process.exit(s.includes('16.8%')&&s.includes('68.7%')?0:1)"` exits 0 — the default state renders fixture `A01` in the served HTML.
2. `npm run build && node -e "const s=require('fs').readFileSync('out/index.html','utf8');process.exit(/aria-live=\"polite\"/.test(s)&&/Interval width/.test(s)&&/percentage points/.test(s)?0:1)"` exits 0.
3. `node scripts/check-bundle.mjs` exits 0 after a build.

**Dependencies.** T14.

---

## T16 — `ModeTabs`, Mode B, `SensitivityTable`

**Build.** `ModeTabs` as a real `tablist`/`tab`/`tabpanel` with arrow-key navigation. Mode B branch of `page.tsx` with the two inputs from PRD §4.3, showing required runs, the achieved half-width at `n` and at `n − 1`, and, when `D > 1`, the base requirement and the inflated total. `SensitivityTable` with the four rows from PRD §4.3 — targets at ½×, 1×, 2×, 4× the current target, clamped to `[0.5, 50]`, duplicate rows after clamping dropped. Mode switch preserves both modes' inputs.

**Files touched.** `src/components/ModeTabs.tsx`, `src/components/SensitivityTable.tsx`, `src/app/page.tsx`, `tests/e2e/modeb.spec.ts`

**Acceptance.**
1. `npm run typecheck`, `npm run lint`, `npm run build` all exit 0.
2. Playwright spec `tests/e2e/modeb.spec.ts`: switch to Mode B, enter `p=50`, `w=5`, `c=95`; assert the text `381` appears; assert `380` appears (the `n − 1` line); switch to Mode A and back and assert `50` and `5` are still in the fields. `npx playwright test tests/e2e/modeb.spec.ts` exits 0.
3. Same spec: with `w=50`, assert the sensitivity table renders 3 rows or fewer (clamping collapses duplicates).

**Dependencies.** T15.

---

## T17 — `copy.ts`

**Build.** Every string from PRD §5 — §5.3 through §5.11 — as a frozen object keyed by the exact identifiers used there (`A_HEADLINE`, `WIDTH_UNUSABLE`, `ZERO_MENTIONS`, `GLOBAL_LOWER_BOUND`, and the rest). Character for character, including the en-dashes, the `±`, and the British spellings where the PRD uses them. Tokens stay as literal `{tokenName}` for `interpret.ts` to substitute. Also export `WIDTH_THRESHOLDS = [8, 15, 30]` and `BUDGET_THRESHOLDS = [100, 500, 2000]`.

**Files touched.** `src/lib/copy.ts`, `tests/copy.test.ts`

**Acceptance.**
1. `tests/copy.test.ts` reads `PRD.md` from disk, extracts every blockquote line in §5.3–§5.10 and every table row string in §5.11, normalises whitespace, and asserts each appears in `copy.ts`. `npm test` exits 0. **This test must read the PRD at runtime, not embed a copy of it.**
2. `npx tsx -e "import {COPY} from './src/lib/copy';const bad=Object.entries(COPY).filter(([,v])=>typeof v==='string'&&/\{[a-zA-Z]+\}/.test(v)===false&&v.length<20);if(Object.keys(COPY).length<25)process.exit(1);console.log(Object.keys(COPY).length)"` prints a number of at least 25.
3. `node -e "const s=require('fs').readFileSync('src/lib/copy.ts','utf8');process.exit(/TODO|TBD|Lorem/i.test(s)?1:0)"` exits 0.

**Dependencies.** T16.

---

## T18 — `interpret.ts`

**Build.** Pure. Signature:

```ts
export interface InterpretedLine { key: keyof typeof COPY; text: string; }
export function interpretModeA(state: AppState, result: WilsonInterval, D: number): InterpretedLine[];
export function interpretModeB(state: AppState, result: ModeBResult): InterpretedLine[];
```

Returns lines in exactly the PRD §5.2 order: headline, exactly one width or budget class, zero or more boundary overlays in the PRD §5.5 / §5.6 listed order, exactly one design note, exactly one ρ note, then `GLOBAL_LOWER_BOUND`. Token substitution uses `format.ts`. Every `{token}` must be replaced; a leftover `{` is a bug the tests catch.

**Files touched.** `src/lib/interpret.ts`, `tests/interpret.test.ts`

**Acceptance.**
1. Test asserts, for all 30 Mode A fixtures, that the returned lines include the fixture's `resultClass` key and exactly one key from the width-class set. `npm test` exits 0.
2. Test asserts, for all 20 Mode B fixtures, that the returned lines include the fixture's `resultClass` key and exactly one key from the budget set.
3. Test asserts every returned `text` satisfies `!text.includes('{')`.
4. Test asserts the last line is always `GLOBAL_LOWER_BOUND`, and that a `single`/`distinct`/`mixed` design note and a ρ note are each present exactly once, across all 56 fixture states.
5. `npx tsx -e "import f from './fixtures/fixtures.json';import {interpretModeA} from './src/lib/interpret';import {wilsonInterval} from './src/lib/stats/wilson';let n=0;for(const c of f.modeA){const l=interpretModeA({mode:'a',a:{mentions:c.x,runs:c.n},b:{planningPct:42,targetHalfWidthPts:5},confidence:c.conf as never,design:'single',rho:0,runsPerPrompt:10},wilsonInterval(c.x,c.n,c.conf as never),1);if(!l.some(x=>x.key===c.resultClass))process.exit(1);n+=l.length}console.log('lines',n)"` prints a line count and exits 0.

**Dependencies.** T17.

---

## T19 — `InterpretationBlock`

**Build.** Renders each `InterpretedLine` as its own `<p>` inside the live region, in order, with `GLOBAL_LOWER_BOUND` styled as a persistent note that has no dismiss control and is not inside a `<details>`. Also renders the ρ sensitivity strip when `design === 'mixed'`: the interval at ρ = 0, 0.05, 0.1, 0.2 as four labelled mini-bars, shown regardless of the current ρ (PRD ADR-8, mechanism 3).

**Files touched.** `src/components/InterpretationBlock.tsx`, `src/app/page.tsx`, `tests/e2e/sensitivity.spec.ts`

**Acceptance.**
1. `npm run build && node -e "const s=require('fs').readFileSync('out/index.html','utf8');process.exit(s.includes('lower bound on your total uncertainty')?0:1)"` exits 0 — the permanent caveat is in the served HTML of the default state.
2. `node -e "const s=require('fs').readFileSync('src/components/InterpretationBlock.tsx','utf8');process.exit(/dismiss|onClose|<details/i.test(s)?1:0)"` exits 0 — the caveat has no dismiss path.
3. Playwright: set design to `mixed`; assert four elements matching `[data-rho]` are present. `npx playwright test tests/e2e/sensitivity.spec.ts` exits 0.

**Dependencies.** T18.

---

## T20 — `urlState.ts`

**Build.** Per PRD §8.4. `parse(params: URLSearchParams): { state: AppState; degraded: boolean }` and `serialise(state: AppState): string`. Keys emitted in the fixed order `m, x, n, p, w, c, d, r, k`; a key omitted when equal to its default; `k` omitted unless `d=mixed`; the default state serialises to the empty string. Unknown keys ignored **without** setting `degraded`. Out-of-range or unparseable known keys fall back to default **and** set `degraded`. `x > n` after parsing resets `x` to its default and sets `degraded`.

**Files touched.** `src/lib/urlState.ts`, `tests/urlState.test.ts`

**Acceptance.**
1. Round-trip property test, 1,000 states from a seeded generator: `parse(new URLSearchParams(serialise(s))).state` deep-equals `s`. `npm test` exits 0.
2. `npx tsx -e "import {parse,serialise} from './src/lib/urlState';const d=parse(new URLSearchParams('')).state;if(serialise(d)!=='')process.exit(1);if(!parse(new URLSearchParams('x=999&n=10')).degraded)process.exit(1);if(parse(new URLSearchParams('utm_source=x')).degraded)process.exit(1);if(serialise(parse(new URLSearchParams('x=21&n=50')).state)!=='?x=21&n=50')process.exit(1);console.log('ok')"` prints `ok`.
3. The three worked examples in PRD §8.4 each round-trip unchanged — asserted explicitly in the test file.

**Dependencies.** T19.

---

## T21 — `ShareRow` (link) and the degraded notice

**Build.** State read from the URL on mount, mirrored back with `history.replaceState` debounced 300 ms — never `pushState`. Copy-link button writing `CANONICAL_BASE + serialise(state)` to the clipboard with a confirmation that does not use an alert. `URL_PARAMS_IGNORED` notice rendered above the inputs when `degraded`, dismissible.

**Files touched.** `src/components/ShareRow.tsx`, `src/app/page.tsx`, `tests/e2e/share.spec.ts`

**Acceptance.**
1. `node -e "const s=require('fs').readFileSync('src/app/page.tsx','utf8')+require('fs').readFileSync('src/components/ShareRow.tsx','utf8');process.exit(s.includes('pushState')?1:0)"` exits 0.
2. Playwright: type 20 characters into the runs field, then assert `page.goBack()` leaves the origin path — that is, history length did not grow. Exits 0.
3. Playwright: load `/?x=999&n=10` and assert the text `Part of that link did not make sense` is visible. Exits 0.
4. Playwright: change inputs, click copy-link, read the clipboard, assert it equals `CANONICAL_BASE` plus the expected query string. Exits 0.

**Dependencies.** T20.

---

## T22 — `/method`, FAQ, JSON-LD, sitemap, robots

**Build.** Everything in PRD §11.3. `/method` with `h2`s phrased as questions, each answered in the first sentence in under 40 words; the canonical required-runs table generated at build time from `fixtures/fixtures.json` — 95% confidence, targets ±10, ±5, ±2 points, planning estimates 10/25/50/75/90%; a `#glossary` section defining the five terms with stable per-term anchors; the §3.2 Wald-versus-Wilson coverage table; the independence argument from `STATS_SPEC.md` §6 including the falsification paragraph; and links to `STATS_SPEC.md` and the repository. `Faq` component whose source array also feeds the `FAQPage` JSON-LD. `SoftwareApplication` JSON-LD in `layout.tsx`. `src/app/sitemap.ts` and `src/app/robots.ts`.

**Files touched.** `src/app/method/page.tsx`, `src/components/Faq.tsx`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`

**Acceptance.**
1. `npm run build && node -e "const s=require('fs').readFileSync('out/method/index.html','utf8');const need=['binomial proportion','Wilson score interval','intracluster correlation','design effect','confidence interval'];process.exit(need.every(t=>s.includes(t))?0:1)"` exits 0.
2. `npm run build && node -e "const s=require('fs').readFileSync('out/method/index.html','utf8');const f=require('./fixtures/fixtures.json');const n=f.modeB.find(r=>r.planningPct===50&&r.targetHalfWidthPts===5&&r.conf===95).requiredRuns;process.exit(s.includes(String(n))?0:1)"` exits 0 — the published table carries the verified figure.
3. `npm run build && node -e "const s=require('fs').readFileSync('out/index.html','utf8');const m=[...s.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));const t=m.map(x=>x['@type']);process.exit(t.includes('SoftwareApplication')&&t.includes('FAQPage')?0:1)"` exits 0 — both blocks present and valid JSON.
4. `npm run build && test -f out/sitemap.xml && test -f out/robots.txt` exits 0.
5. `npm run build && node -e "const s=require('fs').readFileSync('out/method/index.html','utf8');process.exit((s.match(/<h2/g)||[]).length>=5?0:1)"` exits 0.

**Dependencies.** T21.

---

## T23 — Accessibility hardening

**Build.** Everything in PRD §9.1 not already delivered: `focus-visible` rings at 3:1, arrow-key navigation on the tablist, `aria-describedby`/`aria-invalid` on every field, contrast fixes, 400% zoom without horizontal scroll, `prefers-reduced-motion`. `tests/e2e/a11y.spec.ts` running `@axe-core/playwright` over four states — `/` default, `/` invalid, `/method`, and `/` in dark mode.

**Files touched.** `src/app/globals.css`, `src/components/ModeTabs.tsx`, `src/components/NumberField.tsx`, `src/components/ConfidenceSelect.tsx`, `src/components/DesignRadio.tsx`, `src/components/AdvancedDisclosure.tsx`, `src/components/ResultPanel.tsx`, `src/components/IntervalBar.tsx`, `src/components/InterpretationBlock.tsx`, `src/components/SensitivityTable.tsx`, `src/components/ShareRow.tsx`, `src/components/Faq.tsx`, `tests/e2e/a11y.spec.ts`, `package.json`

Those are every component in the tree at this point. Not all will need an edit; the list is exhaustive so that the blast radius of this task is bounded and reviewable rather than open-ended.

**Acceptance.**
1. `npx playwright test tests/e2e/a11y.spec.ts` exits 0 with zero `serious` or `critical` violations in all four states.
2. Playwright: at 1280×720 with `deviceScaleFactor` simulating 400% zoom, assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`. Exits 0.
3. Playwright: tab through the page and assert every focusable element has a computed `outline-width` or `box-shadow` that changes on focus. Exits 0.

**Dependencies.** T22.

---

## T24 — Performance budget, privacy assertion, mobile e2e

**Build.** `tests/e2e/perf.spec.ts` and `tests/e2e/privacy.spec.ts`.

Performance: LCP under 1.5 s with Slow-4G network emulation and 4× CPU throttle; CLS under 0.02 measured via `PerformanceObserver` after hydration; INP under 50 ms averaged over 20 synthetic keystrokes.

Privacy: register a request listener, run a full interaction session entering `x=137, n=421`, then assert that no request URL, query string, or POST body contains `137` or `421`, and that every request host is either the test origin or `va.vercel-scripts.com`.

Mobile: at a 390×664 viewport, assert the bounding box of the interval text is fully within the viewport without scrolling (PRD §6.5), and that every interactive element's box is at least 44×44.

**Files touched.** `tests/e2e/perf.spec.ts`, `tests/e2e/privacy.spec.ts`, `tests/e2e/mobile.spec.ts`, `playwright.config.ts`

**Acceptance.**
1. `npx playwright test tests/e2e/perf.spec.ts tests/e2e/privacy.spec.ts tests/e2e/mobile.spec.ts` exits 0.
2. `npm run build && node scripts/check-bundle.mjs` exits 0 and reports JS at or under 122,880 bytes.
3. `npm run verify` exits 0 end to end.

**Dependencies.** T23.

---

## T25 — Result-card export

**Build.** `src/lib/card.ts` per PRD §11.2 and ADR-7: raw Canvas 2D, 1200×630, the fixed layout and font sizes as specified, word-greedy wrapping via `ctx.measureText` with truncation at three lines, the result URL bottom-right, `system-ui` font stack with no web font, returning a `Blob` from `canvas.toBlob`. Button in `ShareRow` downloading `runs-needed-{mode}-{primary}.png`.

**Files touched.** `src/lib/card.ts`, `src/components/ShareRow.tsx`, `tests/e2e/card.spec.ts`

**Acceptance.**
1. Playwright: click the card button, capture the download, and assert the file is at least 5,120 bytes, that its first eight bytes equal the PNG signature `89 50 4E 47 0D 0A 1A 0A`, and that bytes 16–23 decode to width 1200 and height 630 from the IHDR chunk. Exits 0.
2. `node -e "const s=require('fs').readFileSync('src/lib/card.ts','utf8');process.exit(/html2canvas|satori|import .* from ['\"][^.]/.test(s)?1:0)"` exits 0 — no capture library, no non-relative import.
3. `node scripts/check-bundle.mjs` still exits 0 after the build.

**Dependencies.** T24.

---

## T26 — Repository documentation and deployment

**Build.** Confirm `README.md`, `LICENSE`, `CONTRIBUTING.md`, and `CLAUDE.md` are accurate against the built product. Generate `docs/DEPENDENCIES.md` with `npx license-checker --summary`. Add `@vercel/analytics` to `layout.tsx`. Connect the Vercel project, enable Web Analytics, protect `main` with the CI check.

**Files touched.** `README.md`, `docs/DEPENDENCIES.md`, `src/app/layout.tsx`, `.github/workflows/ci.yml`

**Acceptance.**
1. `npm run verify` exits 0 on a clean checkout of `main`.
2. `python3 scripts/verify_fixtures.py | grep -q "PASS"` exits 0 in CI.
3. `curl -fsS https://runs-needed.vercel.app/ | grep -q "16.8%"` exits 0 — production serves the default result in HTML.
4. `curl -fsS https://runs-needed.vercel.app/method/ | grep -q "Wilson"` exits 0.
5. `node -e "const s=require('fs').readFileSync('docs/DEPENDENCIES.md','utf8');process.exit(/GPL|AGPL|proprietary/i.test(s)?1:0)"` exits 0 — no copyleft or proprietary licence entered the tree.
6. `grep -rn "track(" src/ | grep -v "track()" | wc -l` prints `0` — no analytics call carries an argument.

**Dependencies.** T25.

---

## Post-v1 tasks

T27–T29 (comparison mode), T30–T33 (stratified multi-engine), T34–T36 (embeddable widget), and T37–T40 (measured ρ) correspond to roadmap Phases 10–13 in PRD §12. They are deliberately not decomposed here: each depends on what v1 launch reveals, and Phase 11 in particular is blocked on a human weighting decision that has not been made. Decomposing them now would produce exactly the kind of speculative specification this document exists to avoid. `prompts/phase-10` through `prompts/phase-13` contain the session-opening briefs for each.
