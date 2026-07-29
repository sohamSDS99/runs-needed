# Phase 4 — Mode B usable

Branch: `phase-4-mode-b-ui`. Estimated 1 hour.

## Read these first

- `PRD.md` §4.3 — Mode B inputs, validation order, outputs including the sensitivity table
- `PRD.md` §6.1 item 2 — the mode control's semantics
- `STATS_SPEC.md` §4 — so you understand what the displayed `n − 1` half-width is proving on screen
- `CLAUDE_CODE_TASKS.md` — T16

## Build

T16: `ModeTabs`, `SensitivityTable`, the Mode B branch of `page.tsx`.

Displaying the achieved half-width at both `n` and `n − 1` is not decoration. It shows the reader that the answer is the *smallest* sufficient sample size, which is the claim Mode B makes and the one a skeptic will check first.

## Do not

- **Do not implement the mode switch as two buttons with a `useState`.** It must be a real `tablist` / `tab` / `tabpanel` with arrow-key navigation. `PRD.md` §6.1. Phase 7's axe run will fail otherwise, and fixing it then is more work than doing it now.
- **Do not discard the other mode's inputs on switch.** Both modes' values live in one `AppState` and both persist.
- **Do not recompute the sample size with a closed form for the sensitivity table.** Call `requiredRuns` four times. It costs microseconds.
- **Do not let the sensitivity table show duplicate rows.** Targets are clamped to `[0.5, 50]`, and clamping can collapse two rows into one — drop the duplicate. At `w = 50` this leaves three rows or fewer.
- **Do not write interpretation copy.** Still Phase 5.
- **Do not add a chart to Mode B.** The answer is one integer; a chart of one integer is decoration.

## Definition of done

Every acceptance command in T16, plus:

```bash
npm run typecheck && npm run lint && npm run build; echo "expect 0: $?"
npx playwright test tests/e2e/modeb.spec.ts; echo "expect 0: $?"
node scripts/check-bundle.mjs; echo "expect 0: $?"
git diff --exit-code src/lib/stats/ fixtures/; echo "expect 0: $?"
```

Manually confirm three values against `fixtures/fixtures.json`: `p=50, w=5, c=95` → 381 (`B02`); `p=5, w=5, c=95` → 83 (`B17`); `p=50, w=0.5, c=99` → 66,343 (`B15`). The middle one is the case where a Wald closed form would say 73, so if it shows 73 the estimator was quietly swapped.

## Report

Exit codes, and those three values as displayed by the running app.
