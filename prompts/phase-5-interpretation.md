# Phase 5 — The interpretation layer

Branch: `phase-5-interpretation`. Estimated 1.25 hours.

**This phase is the product.** The interval is arithmetic that a spreadsheet could do. The sentence that tells someone what the interval means is the reason the tool exists, and it is the thing that will be quoted, screenshotted, and argued with.

## Read these first

- `PRD.md` §5 — **the entire section**, and treat it as a legal document. §5.1 defines every token, §5.2 fixes the composition order, §5.3–§5.11 contain every string.
- `PRD.md` §7 ADR-8 — why the permanent caveat and the sensitivity strip exist and why neither may be made dismissible
- `CLAUDE_CODE_TASKS.md` — T17, T18, T19

## Build

T17 (`copy.ts`), T18 (`interpret.ts`), T19 (`InterpretationBlock`).

## Do not

- **Do not rewrite, shorten, soften, or improve a single string.** Copy them character for character, including the en-dashes, the `±`, the British spellings (`generalises`, `behaviour`, `labelled`), and the sentence rhythm. `tests/copy.test.ts` reads `PRD.md` at runtime and will fail on any drift. If a string is genuinely wrong, change `PRD.md` first and report that you did.
- **Do not add an emoji, an exclamation mark, or a colour-coded verdict badge.** The tone is deliberate: a calculator that tells an agency their number is worthless has to sound like a colleague, not like a warning label.
- **Do not add a "good / fair / poor" rating.** The width classes are descriptive, not evaluative. A 51.9-point interval is not a bad score; it is a small sample.
- **Do not put `GLOBAL_LOWER_BOUND` behind a dismiss button, a `<details>`, a tooltip, or a "learn more" link.** ADR-8. It renders in every state, in both modes, always visible. T19's acceptance criterion greps for the absence of a dismiss path.
- **Do not hide the ρ sensitivity strip behind the advanced disclosure.** When the design is `mixed` it shows regardless of the current ρ. That is the whole point of mechanism 3 in ADR-8: a user who never touches the control still sees how much the assumption is carrying.
- **Do not let more than one width class or budget class render at once.** Exactly one. T18 asserts this across all 50 Mode A and Mode B fixtures.
- **Do not leave a `{token}` unreplaced.** Any `{` in rendered output is a test failure.
- **Do not compute statistics in `interpret.ts`.** It receives a result and formats prose. Its only imports are types, `copy.ts`, and `format.ts`.

## Definition of done

Every acceptance command in T17–T19, plus:

```bash
npm test; echo "expect 0: $?"
npm run build

# The permanent caveat is in the served HTML of the default state.
grep -c "lower bound on your total uncertainty" out/index.html   # expect at least 1

# No unreplaced token reached the page.
grep -o "{[a-zA-Z]*}" out/index.html; echo "expect no output above"

npx playwright test tests/e2e/sensitivity.spec.ts; echo "expect 0: $?"
node scripts/check-bundle.mjs; echo "expect 0: $?"
git diff --exit-code src/lib/stats/ fixtures/ PRD.md; echo "expect 0 unless you changed a string on purpose: $?"
```

## Report

Exit codes, the count of copy keys in `copy.ts`, and — if the last command returned non-zero — exactly which string you changed in `PRD.md` and why. A copy change is legitimate; a silent one is not.
