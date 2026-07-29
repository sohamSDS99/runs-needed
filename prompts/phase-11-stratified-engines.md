# Phase 11 — Multi-engine stratified estimates

**Post-v1, and blocked on a human decision that has not been made.** Branch: `phase-11-stratified`. Estimated 4.5 hours.

## Stop here first

This phase cannot be started by an agent alone. It requires a product decision that is not a technical question:

> **When combining per-engine visibility rates into one overall number, how are the engines weighted?**
>
> (a) Equally — simple, defensible, and wrong in the sense that it treats a rarely-used engine as equal to a dominant one.
> (b) By engine market share — requires a market-share source, which must be cited, dated, and will go stale.
> (c) By the client's own traffic mix — most defensible per client, and impossible for a tool that stores nothing about the client.
> (d) Refuse to combine, and report only per-engine intervals side by side.

Option (d) is the one most consistent with the product's philosophy and costs the least, and it may well be the right answer — a single blended "AI visibility" number is arguably the same category error the tool exists to criticise. **Ask the human, record the decision as a new ADR in `PRD.md` §7, then build.** Do not pick one silently.

## Read these first

- `PRD.md` §12, the Phase 11 row
- `PRD.md` §7 ADR-3 — its reversal trip-wire is the URL schema question this phase raises
- `STATS_SPEC.md` §5 — the design-effect machinery you will be generalising

## Method, if (a), (b), or (c) is chosen

Per-engine Wilson intervals, then a weighted estimate `p̂ = Σ wₖ p̂ₖ` with variance `Var(p̂) = Σ wₖ² vₖ`, where `vₖ` is the variance implied by engine `k`'s effective sample size. Back-solve an effective `n` from the combined variance for display, so the overall interval is still a Wilson interval on a stated effective sample size rather than a normal approximation.

**Flag for human review:** the back-solve step is a presentational convenience, not a standard estimator, and a statistician should confirm it before it ships. Verify the stratified variance against a survey-statistics reference implementation — R's `survey` package with stratum weights is the most accessible option.

## URL schema

Repeated-key form: `e=chatgpt:21:50&e=claude:18:50&e=google:9:50`. This is ADR-3's specified response to more state — a compact readable form, not a change of mechanism. Fail over to compression only if a real URL exceeds 1,500 characters, and record that as an ADR amendment.

## Do not

- Do not ship a blended number without the per-engine intervals visible next to it.
- Do not weight by anything the tool has to store about the user. No accounts, no persistence.
- Do not let the weighting scheme be implicit in the code. It appears in the copy, in `/method`, and in a new ADR.
- Do not skip the human decision above.

## Definition of done

The weighting ADR exists in `PRD.md` §7 with alternatives and a reversal trip-wire; new fixtures verified independently; the stratified variance cross-checked against a reference implementation; per-engine and combined intervals both rendered; `src/lib/stats/` still imports nothing.
