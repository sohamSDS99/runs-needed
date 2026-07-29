# Phase 3 — Mode A usable

Branch: `phase-3-mode-a-ui`. Estimated 1.75 hours. First phase in which UI may exist.

## Read these first

- `PRD.md` §4.1, §4.2 — inputs, validation order, states
- `PRD.md` §6 — the full interface spec, and §6.4 for why the bar is designed the way it is
- `PRD.md` §8.2 — the state model, typed
- `PRD.md` §9.1 — the screen-reader description list, which is written out verbatim and must be copied exactly
- `CLAUDE_CODE_TASKS.md` — T11 through T15

## Build

T11 (`format.ts`), T12 (`brand.ts`, layout, page shell), T13 (input components), T14 (`IntervalBar`), T15 (`ResultPanel` and Mode A wiring).

By the end, loading `/` must show 16.8% – 68.7% with no interaction at all. That is fixture `A01`, and it is the landing state because the argument for the product is one screen of it.

## Do not

- **Do not write interpretation copy.** No explanatory sentences, no "this means", no helpful hints. That is Phase 5, and every string is already written in `PRD.md` §5. If the result panel looks bare at the end of this phase, it is correct.
- **Do not use `Math.round` or bare `toFixed` in `format.ts`.** The rounding rule is `Math.floor(y + 0.5)` on the scaled integer, specified in `PRD.md` §5.1, so that behaviour is identical across engines.
- **Do not clear the result when input becomes invalid.** Dim it to 40% and set `aria-busy`. `PRD.md` §4.2. On a client call, a blank panel mid-keystroke reads as a crash.
- **Do not start the page in an empty state.** Defaults are populated.
- **Do not add a submit button, a loading spinner, or a skeleton.** Every computation is synchronous and sub-millisecond; there is no state to load.
- **Do not put an in-field grey hint in place of a label.** T13 asserts on the absence of that attribute.
- **Do not add `aria-label` to the interval bar.** It is `aria-hidden="true"`; the accessible content is the text and the `sr-only` list. `PRD.md` §9.1.
- **Do not touch `src/lib/stats/`.** It is finished and verified. If you believe it needs a change, stop and report.
- **Do not add URL handling.** Phase 6.

## Definition of done

Every acceptance command in T11–T15, plus:

```bash
npm run build
grep -o "16.8%" out/index.html | head -1        # expect: 16.8%
grep -c "aria-live=\"polite\"" out/index.html   # expect: at least 1
grep -c "percentage points" out/index.html      # expect: at least 1
node scripts/check-static.mjs && node scripts/check-bundle.mjs; echo "expect 0: $?"
npm test; echo "expect 0: $?"
git diff --exit-code src/lib/stats/; echo "expect 0: $?"
```

## Report

Exit codes, the reported bundle sizes against the 120 KB budget, and confirmation that the served HTML — not the hydrated page — contains the default result.
