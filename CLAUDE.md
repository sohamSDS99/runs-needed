# Instructions for AI coding agents working in this repository

Read this before touching anything. It exists to stop the five mistakes most likely to be made here.

## What this project is

A static, client-side calculator that converts a binomial proportion (mentions out of runs) into a Wilson score confidence interval, and inverts that to a required sample size. The specification is complete. Your job is to implement it exactly, not to redesign it.

**Authoritative documents, in precedence order.** If they conflict, the higher one wins and the conflict is a bug worth reporting.

1. `fixtures/fixtures.json` — expected numerical values. Never edit this to make a test pass.
2. `STATS_SPEC.md` — formulas, edge cases, rounding rules.
3. `PRD.md` — product spec. **§5 is the normative source for every user-facing string**, character for character.
4. `CLAUDE_CODE_TASKS.md` — the build order and the acceptance criteria.

## Five hard rules

**1. Never edit a fixture, a verifier, or a spec to make a check pass.** If `npm test` disagrees with `fixtures/fixtures.json`, the implementation is wrong. The four files `scripts/verify_fixtures.py`, `scripts/verify_fixtures.R`, `scripts/coverage.py`, `scripts/monotonicity.py` are frozen; T10 asserts they are unmodified via `git diff --exit-code`.

**2. Nothing inside `src/lib/stats/` may import from outside `src/lib/stats/`.** Not React, not `format.ts`, not `copy.ts`, not a stats library. The directory returns numbers and error codes and never a formatted string or a piece of prose. ESLint enforces this and CI treats a violation as an error. The reason is in `PRD.md` ADR-4: the module has to be copyable into an unrelated project, which is what makes the math auditable.

**3. No backend, no paid dependency, no data leaving the browser.** No API routes, no `"use server"`, no server actions, no database, no auth, no `localStorage`, no `sessionStorage`, no cookies, no third-party script except the Vercel Analytics beacon. `next.config.ts` sets `output: 'export'`, so most violations fail the build; `scripts/check-static.mjs` catches the rest. Runtime dependencies are limited to `next`, `react`, `react-dom`, `@vercel/analytics`.

**4. Copy is specified, not authored.** Every user-facing sentence is written out in `PRD.md` §5. Copy it exactly — the en-dashes, the `±`, the British spellings. Do not improve it, shorten it, add an emoji, or make it friendlier. `tests/copy.test.ts` reads `PRD.md` at runtime and fails on any drift. If a string genuinely needs to change, change `PRD.md` first and say so.

**5. Statistics before interface.** Tasks T03–T10 complete the stats core and its tests. **No file under `src/app/` or `src/components/` may exist before T11.** If you find yourself writing a component during T04, stop.

## Things that will look like bugs and are not

- **`wilsonFromProportion` accepts a non-integer `n`.** Intentional. That is how the design effect is applied — `n_eff = n / D` is rarely an integer, and keeping the formula continuous means one code path instead of two. See `STATS_SPEC.md` §5.2.
- **Snap-then-clamp, not clamp.** At `p̂ = 0`, `centre − half` evaluates to about `+2e-19` in double precision, so clamping to `[0, 1]` does not produce `0`. The bounds must be snapped on `p̂ <= 0` and `p̂ >= 1` *before* clamping. `STATS_SPEC.md` §3.3. Fixtures `A08`, `A09`, `A22`, `A23` exist to catch exactly this.
- **Mode B uses a binary search, not `z²p(1−p)/w²`.** The closed form under-sizes by 12% at `p = 0.05` and returns 0 at `p = 0`. `STATS_SPEC.md` §4.3.
- **Only four confidence levels, with hard-coded z values.** There is deliberately no normal-quantile function. `PRD.md` ADR-4.
- **The default page state is 4 mentions in 10 runs.** Not empty. The landing state is the argument for the product.
- **The permanent caveat has no dismiss button.** `PRD.md` ADR-8. Do not add one, do not collapse it into a `<details>`.
- **The interval bar is `aria-hidden`.** The authoritative content is the text and the `sr-only` description list. `PRD.md` §9.1.

## Before you say you are done

```bash
npm run verify                      # types, lint, unit, build, static check, bundle budget, e2e
python3 scripts/verify_fixtures.py  # 457 assertions against SciPy and statsmodels
node scripts/check-no-placeholders.mjs
```

All three must exit 0. Then re-read the acceptance criteria for your task and run each command in it. Every criterion in `CLAUDE_CODE_TASKS.md` is a shell command with a defined exit code — none of them require your judgement, so do not substitute it.
