# Phase 2 — Proof the math is correct

Branch: `phase-2-verification`. Estimated 1.25 hours. Nothing after this phase is worth building if this phase does not pass.

## Read these first

- `TEST_FIXTURES.md` — all of it, including the "Notes on specific fixtures" table, which explains what each awkward case is defending against
- `fixtures/fixtures.json` — skim the structure; you will be importing it directly
- `CLAUDE_CODE_TASKS.md` — T08, T09, T10
- `PRD.md` §10 — the 14 deploy gates, so you know which ones this phase turns on (3, 4, 5, 6, 11, 14)

## Build

T08, T09, T10.

## Do not

- **Do not edit `fixtures/fixtures.json`.** Ever, for any reason, including "the expected value looks wrong". If the implementation disagrees with the fixtures, the implementation is wrong. T10's acceptance criteria include a `git diff --exit-code` on the verifier scripts precisely because this is the most tempting shortcut available in the whole build.
- **Do not edit `scripts/verify_fixtures.py`, `scripts/verify_fixtures.R`, `scripts/coverage.py`, or `scripts/monotonicity.py`.** They are frozen. They were written before the implementation existed, which is the only thing that makes them evidence.
- **Do not copy expected values into test files.** Import the JSON. A hard-coded expectation is a value that can drift from the source of truth, and ADR-9 exists to make that impossible.
- **Do not loosen a tolerance to make a test pass.** Proportions are `1e-12`; `requiredRuns` is exact. If you cannot hit `1e-12`, the formula is arranged wrongly — most likely the half-width is being computed as `(upper − lower) / 2` from already-rounded bounds instead of directly.
- **Do not skip the mutation checks** in T08.3 and T09.4. A test suite that passes is not evidence; a test suite that fails when you break the code on purpose is.

## Definition of done

```bash
npm test; echo "expect 0: $?"

pip install --quiet scipy statsmodels
python3 scripts/verify_fixtures.py            # expect: assertions run: 457 / PASS
python3 scripts/monotonicity.py               # expect: PASS
python3 scripts/coverage.py | grep 0.0955     # expect: the n=10 Wald row

git diff --exit-code scripts/verify_fixtures.py scripts/verify_fixtures.R \
  scripts/coverage.py scripts/monotonicity.py; echo "expect 0: $?"
git diff --exit-code fixtures/fixtures.json; echo "expect 0: $?"

npm run build && node scripts/check-bundle.mjs; echo "expect 0: $?"
```

Plus both mutation checks, showing the test suite failing and then passing again after restore.

## Report

The assertion count from the Python verifier, the test count from Vitest, and the two mutation-check results. If any fixture could not be reproduced, **stop and report it rather than adjusting anything** — a fixture that cannot be reproduced is either an implementation bug or an error in `STATS_SPEC.md`, and both need a human.
