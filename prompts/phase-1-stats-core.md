# Phase 1 — The statistics core

Branch: `phase-1-stats-core`. Estimated 1.5 hours. **This is the phase where a mistake is career-negative for the person shipping this.** Slow down.

## Read these first

- `STATS_SPEC.md` — **all of it**, before writing a line. Sections 2, 3.1, 3.3, 4.1, 5.2 contain the formulas you will implement; §3.2, §4.3, and §6 explain why the obvious alternatives are wrong, and you need that to resist simplifying them.
- `CLAUDE_CODE_TASKS.md` — T03 through T07
- `CLAUDE.md` — "Things that will look like bugs and are not". Every item in that list is something an agent has a strong prior to get wrong here.

## Build

T03, T04, T05, T06, T07 in order. Five files under `src/lib/stats/`, plus `index.ts`.

## Do not

- **Do not implement a normal-quantile function.** Confidence levels are a closed set of four and the z values are literals. `PRD.md` ADR-4.
- **Do not import a statistics library.** Not `jstat`, not `simple-statistics`, not `mathjs`. The ESLint boundary rule from Phase 0 will stop you, and if it does not, that is a Phase 0 defect worth reporting.
- **Do not use the Wald formula anywhere**, including as a starting guess for the Mode B search. `STATS_SPEC.md` §4.3 has the table showing it under-sizes by 12% at p = 0.05 and returns 0 at p = 0.
- **Do not clamp without snapping.** At p̂ = 0 the expression `centre − half` evaluates to about `+2e-19`, so `Math.max(0, …)` leaves a positive value where the answer is exactly 0. `STATS_SPEC.md` §3.3. This defect was found by a verification harness rather than by reading, which is why the fixtures for it exist.
- **Do not round or coerce `n` to an integer in `wilsonFromProportion`.** Non-integer `n` is the design-effect path and it must work. `STATS_SPEC.md` §5.2.
- **Do not evaluate the Mode B half-width at `round(p*n)/n`.** Always at the continuous `p`; that is what makes the function monotone and the search valid. `STATS_SPEC.md` §4.2.
- **Do not validate inside the estimator functions.** They assume valid input; validation is T07 and lives in `validate.ts`.
- **Do not write a single React component or a single test file.** Tests are Phase 2 — deliberately, so that the core is written against the specification rather than against a test you wrote to match your implementation.

## Definition of done

Run every acceptance command in T03 through T07 and paste the results. Then this, which is the phase's real gate:

```bash
# Nothing in the stats core imports anything outside it.
grep -rn "^import\|from '" src/lib/stats/ | grep -v "from '\./" ; echo "expect no output above"

# No React, no framework, anywhere in the directory.
grep -rniE "react|next/|useState|jsx" src/lib/stats/ ; echo "expect no output above"

npm run typecheck; echo "expect 0: $?"
npm run lint; echo "expect 0: $?"
ls src/app src/components 2>/dev/null; echo "expect 'No such file' or empty"
```

## Report

The acceptance results, plus one sentence per file on what it exports. If you were tempted to deviate from `STATS_SPEC.md` anywhere, say where and why — that is useful signal even when the specification turns out to be right.
