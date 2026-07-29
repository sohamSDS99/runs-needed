# Phase 10 — Before / after comparison mode

**Post-v1.** Blocked until v1 is live and has been read by at least one hostile reader. Branch: `phase-10-comparison`. Estimated 3 hours.

## The question this answers

"Your number moved 4 points, what happened?" — the sentence the agency persona is trying to survive on a client call. v1 lets them show that a single measurement is imprecise. Phase 10 lets them show that a *difference* between two measurements is inside the noise.

## Read these first

- `PRD.md` §12, the Phase 10 row
- `PRD.md` §7 ADR-1 and ADR-3 — the reversal trip-wires this phase tests
- `STATS_SPEC.md` §9, source 7 — Newcombe (1998)

## Method — decided, not open

Use **Newcombe's hybrid score interval** for the difference between two independent proportions: construct the Wilson interval for each proportion separately, then combine. For `p̂₁` with Wilson bounds `(l₁, u₁)` and `p̂₂` with `(l₂, u₂)`, the interval for `p₁ − p₂` is

```
  lower = (p̂₁ − p̂₂) − z·√( l₁(1−l₁)/n₁ + u₂(1−u₂)/n₂ )
  upper = (p̂₁ − p̂₂) + z·√( u₁(1−u₁)/n₁ + l₂(1−l₂)/n₂ )
```

**Source:** Newcombe, R. G. (1998), *Statistics in Medicine* 17(8): 873–890, method 10. Chosen because it is Wilson-based (consistent with v1), closed-form (no backend, confirming ADR-1's trip-wire is not triggered), and performs well at small `n`, which is the entire operating range.

**Before writing any code, verify the formula against a primary source and reproduce at least eight fixtures with `PropCIs::diffscoreci` in R or an equivalent.** The direction of the asymmetry — `l₁` paired with `u₂` and vice versa — is the detail most often transcribed wrongly, and getting it backwards produces an interval that looks plausible and is wrong.

## Order of work — non-negotiable

1. Write the fixtures first, verified independently, and extend `fixtures/fixtures.json` with a `twoProportion` section.
2. Write `src/lib/stats/twoProportion.ts`, still importing nothing.
3. Write the interpretation copy **into `PRD.md` §5 first**, verbatim, covering at minimum: the difference interval contains zero (the change is indistinguishable from noise); the difference interval excludes zero (the change survives the noise); both samples too small for the comparison to mean anything. Then implement it.
4. Only then the UI: a third mode `m=c`, URL keys `x1, n1, x2, n2`.

## Do not

- Do not report a p-value. The product's whole argument is that point summaries hide uncertainty, and a p-value is a point summary. An interval on the difference, and a sentence about whether it contains zero, is the answer.
- Do not use a two-sample z-test with pooled variance. Same Wald pathologies at small `n`.
- Do not reuse `wilsonInterval` and subtract the bounds. That is a different and wider interval, and it is the mistake this method exists to avoid.
- Do not add a backend. If you believe you need one, re-read ADR-1's trip-wire: this phase was specified precisely to test it, and the method above is closed-form.

## Definition of done

`npm run verify` and `python3 scripts/verify_fixtures.py` both exit 0 with the new fixtures included; the independent R or Python cross-check of the difference interval reproduces every new fixture; `src/lib/stats/` still imports nothing; the copy test still passes against `PRD.md`.
