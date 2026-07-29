# Phase 13 — Replace the ρ assumption with a measurement

**Post-v1, last, and the only phase that requires collecting data.** Branch: `phase-13-measured-rho`. Estimated 6 hours.

## Why this is the phase that matters most

Every interval this tool produces rests on ρ, and ρ is currently a guess — `STATS_SPEC.md` §7 item 1 says so, flagged for human review, and the tool says so on screen. The presets 0.05, 0.1, 0.2 are magnitudes borrowed from clustered survey research, not measurements of LLM behaviour. Until they are measured, the most important number in the product is the least evidenced one.

Measuring it turns the project from a calculator into a citable source. It is last because the number is worthless until the calculator that consumes it exists, and because it is the only phase whose cost is measured in API spend rather than hours.

## Read these first

- `STATS_SPEC.md` §5, §6, §7 — the design-effect model, the independence argument, and the exact wording of the flag you are clearing
- `PRD.md` §7 ADR-8 — its reversal trip-wire is what this phase triggers
- The SparkToro / Gumshoe methodology FAQ, on the caching question they left open

## What to produce

1. **A dataset.** Repeated identical prompt runs, enough prompts and enough repeats to estimate a within-prompt correlation. State the collection method, the models and versions, the dates, the geography, and whether personalisation and history were on. Raw data committed to the repository, in the open.
2. **An estimate of ρ, with its own interval.** A one-way random-effects intraclass correlation is the natural estimator. Report it per engine as well as pooled, because the pooled figure may hide a real difference.
3. **An honest statement of what the estimate does and does not cover.** In particular whether the correlation looks exchangeable within a prompt — which is what `1 + (R−1)ρ` assumes — or autocorrelated in time, which would mean the inflation model itself is wrong and not just the parameter. `STATS_SPEC.md` §6 names this as the strongest objection to the tool; this is the phase that can answer it.
4. **The ADR-8 update**, with the new default ρ and the reasoning.
5. **The `STATS_SPEC.md` §7 item 1 flag cleared**, and item 2 revisited if the cluster-size distribution turns out to matter.

## Note on cost

Collecting this data may cost money in API calls. **That does not violate the zero-cost constraint**, which is about the deployed product having no recurring cost — the calculator still runs free forever. But keep the collection in a separate repository or a clearly separated directory with no runtime coupling, so nothing in the shipped bundle ever depends on it.

## Do not

- Do not change the default ρ without publishing the data and the method. A measured-looking default with no evidence behind it is worse than an admitted guess, because it removes the reader's ability to discount it.
- Do not report a single pooled ρ if the per-engine estimates differ materially. Report both.
- Do not quietly drop the `GLOBAL_LOWER_BOUND` caveat once ρ is measured. Measuring the within-prompt correlation does not address prompt selection, model drift, personalisation, or geography — the interval is still a lower bound, just a better one.
- Do not overclaim. A single builder's dataset is not a definitive answer, and the SparkToro authors' own framing — publish it, invite replication, retract if wrong — is the right posture to copy.

## Definition of done

A published ρ estimate with stated methodology and raw data in the repository; the ADR-8 trip-wire formally triggered and the ADR amended; `STATS_SPEC.md` §7 item 1 rewritten from **ASSUMPTION — FLAGGED FOR HUMAN REVIEW** to a cited measurement; the new default live; `npm run verify` and `python3 scripts/verify_fixtures.py` both exit 0.
