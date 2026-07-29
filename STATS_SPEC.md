# Statistical Specification

**Audience:** a statistician auditing this in ten minutes, and a build agent implementing it with no other reference.

**Scope:** everything under `src/lib/stats/`. That directory imports nothing. This document describes it completely.

---

## 1. Notation

| Symbol | Meaning | Type |
|---|---|---|
| `x` | number of runs in which the brand appeared ("successes", "mentions") | integer, `0 ≤ x ≤ n` |
| `n` | number of runs ("trials") | integer, `1 ≤ n ≤ 200000` |
| `p̂` | observed proportion, `x / n` | real in `[0, 1]` |
| `θ` | the unknown true appearance probability being estimated | real in `[0, 1]` |
| `1 − α` | confidence level | one of `0.80, 0.90, 0.95, 0.99` |
| `z` | `Φ⁻¹(1 − α/2)`, the two-sided standard normal quantile | positive real |
| `L, U` | lower and upper confidence bounds for `θ` | real in `[0, 1]`, `L ≤ U` |
| `h` | half-width, `(U − L) / 2` before clamping | positive real |
| `W` | interval width in percentage points, `(U − L) × 100` | positive real |
| `w` | target half-width in percentage points (Mode B input) | real in `[0.5, 50]` |
| `ρ` | intracluster correlation coefficient | real in `[0, 0.9]` |
| `R` | average number of runs per prompt (cluster size) | integer, `1 ≤ R ≤ n` |
| `D` | design effect | real, `≥ 1` |
| `n_eff` | effective sample size, `n / D` | real, `> 0`, **not necessarily an integer** |

"Percentage point" means an absolute difference on the 0–100 scale. A move from 40% to 44% is 4 percentage points and a 10% relative increase; this document and the product only ever use percentage points.

---

## 2. The z constants

Confidence levels are a closed set of four (PRD ADR-4), so no quantile function is implemented. The four values below are `scipy.stats.norm.ppf(1 - (1-c)/2)` at IEEE-754 double precision and are hard-coded in `src/lib/stats/z.ts`.

| Confidence | α | `z = Φ⁻¹(1 − α/2)` |
|---|---|---|
| 80% | 0.20 | `1.2815515655446004` |
| 90% | 0.10 | `1.6448536269514722` |
| 95% | 0.05 | `1.959963984540054` |
| 99% | 0.01 | `2.5758293035489004` |

Verified by `scripts/verify_fixtures.py`, which recomputes each from `scipy.stats.norm.ppf` and asserts agreement to `1e-15`. These are also the standard tabulated values (`z₀.₉₇₅ = 1.95996`, `z₀.₉₉₅ = 2.57583`).

---

## 3. The estimator: Wilson score interval

### 3.1 Definition

The Wilson score interval is the set of `θ` not rejected by the score test at level `α` — that is, the two roots in `θ` of

```
        | p̂ − θ |
    ─────────────────── = z
     √( θ(1 − θ) / n )
```

Squaring and rearranging gives the quadratic `(p̂ − θ)² = z²θ(1 − θ)/n`, whose closed-form solution is:

```
            p̂ + z²/(2n)
  centre = ───────────────
             1 + z²/n

                 z              ┌──────────────────────┐
  h      = ───────────── ·  √   │ p̂(1 − p̂)/n + z²/(4n²) │
             1 + z²/n           └──────────────────────┘

  L = centre − h        U = centre + h
```

**Source:** Wilson, E. B. (1927). "Probable Inference, the Law of Succession, and Statistical Inference." *Journal of the American Statistical Association* 22(158): 209–212. Restated as equation (2) in Brown, Cai & DasGupta (2001), *Statistical Science* 16(2): 101–133, [Project Euclid](https://projecteuclid.org/journals/statistical-science/volume-16/issue-2/Interval-Estimation-for-a-Binomial-Proportion/10.1214/ss/1009213286.full).

`scripts/verify_fixtures.py` checks the closed form against a numerical solution of the defining equation via `scipy.optimize.brentq` for every fixture. That validates the algebra above, not merely its arithmetic.

### 3.2 Why Wilson rather than Wald

The Wald interval, `p̂ ± z√(p̂(1−p̂)/n)`, is the one taught first and the one a naive implementation produces. It fails in three ways that matter precisely in this product's operating range of `n = 10 … 50`.

**Coverage collapse.** Exact coverage probability, computed as `Σₓ 1{L(x) ≤ θ ≤ U(x)} · Binom(x; n, θ)` over `θ = 0.01, 0.02, …, 0.99` at nominal 95%:

| n | Wilson, minimum coverage | Wilson, mean | Wald, minimum coverage | Wald, mean |
|---|---|---|---|---|
| 10 | 0.9044 | 0.9553 | **0.0955** | 0.7762 |
| 20 | 0.9245 | 0.9538 | 0.1821 | 0.8534 |
| 50 | 0.9106 | 0.9501 | 0.3948 | 0.9079 |

A nominally 95% Wald interval at `n = 10` has true coverage as low as **9.6%** at some values of `θ`. This is reproducible with `scripts/coverage.py`. Brown, Cai & DasGupta open their paper with exactly this point, describing the Wald interval's behaviour as "far more persistent" a problem than previously appreciated, and recommend Wilson for small `n`.

**Degeneracy at the boundaries.** At `x = 0`, Wald returns `[0, 0]` — a zero-width interval asserting the true rate is exactly zero from ten observations. At `x = n` it returns `[1, 1]`. Both are the states a marketer is most likely to hit, and both are the states where a wrong answer is most confidently wrong. Wilson returns `[0, 0.2775]` and `[0.7225, 1]` at `n = 10, 95%` (fixtures `A08`, `A09`).

**Bounds outside [0, 1].** At `x = 1, n = 20, 95%`, Wald gives `[−0.0455, 0.1455]`. A negative visibility rate is not a rounding problem; it is evidence the method does not apply. Wilson gives `[0.0089, 0.2361]` (fixture `A12`) and is provably contained in `[0, 1]` for all valid inputs, since it is the root set of a quadratic whose roots lie in `[0, 1]` by construction.

**Alternatives considered and rejected.** *Clopper–Pearson* ("exact") guarantees coverage ≥ `1 − α` but is conservative — noticeably wider, which in this product would overstate uncertainty and hand critics the opposite objection; it is nevertheless computed for every Mode A fixture as a reference column so a reader can see the gap. *Jeffreys* (equal-tailed Beta(x+½, n−x+½)) is co-recommended by Brown, Cai & DasGupta and performs comparably, but requires an incomplete beta function — a dependency or 80 lines of numerics, against ADR-4, for no gain in this range. *Agresti–Coull* is simpler than Wilson but is an approximation *to* Wilson and is recommended by the same authors only for larger `n`; using it would mean shipping a worse version of a formula we already have in closed form. *Continuity-corrected Wilson* is more conservative and defensible, but the correction is another modelling choice to defend and it widens intervals that are already wide enough to make the product's point.

### 3.3 The snap-then-clamp rule

Algebraically `L = 0` exactly when `p̂ = 0`, and `U = 1` exactly when `p̂ = 1`. In IEEE-754 double arithmetic `centre − h` at `p̂ = 0` evaluates to roughly `+2 × 10⁻¹⁹`, not `0`. Implementations must therefore snap before clamping:

```
L = (p̂ ≤ 0) ? 0 : min(1, max(0, centre − h))
U = (p̂ ≥ 1) ? 1 : min(1, max(0, centre + h))
```

Clamping alone is insufficient, since the spurious value is positive. This rule is asserted by fixtures `A08`, `A09`, `A10`, `A11`, `A22`, `A23` and by the containment property test (PRD §10 gate 6). It was found by the verification harness, not by inspection, which is the reason the harness exists.

### 3.4 Edge-case table

`n = 10` and 95% confidence unless stated. Values to 4 dp; full precision in `fixtures/fixtures.json`.

| Case | Input | `L` | `U` | `W` (pts) | Behaviour |
|---|---|---|---|---|---|
| No mentions | `x=0, n=10` | `0` exactly | `0.2775` | 27.75 | `U = z²/(n + z²)`. One-sided in effect: rules out a large rate, does not establish absence. |
| All mentions | `x=10, n=10` | `0.7225` | `1` exactly | 27.75 | `L = n/(n + z²)`. Mirror image of the above; identical width. |
| Single run, absent | `x=0, n=1` | `0` exactly | `0.7935` | 79.35 | Valid, and nearly the whole scale. Copy `SINGLE_RUN` fires. |
| Single run, present | `x=1, n=1` | `0.2065` | `1` exactly | 79.35 | As above. |
| Two runs, both present | `x=2, n=2` | `0.3424` | `1` exactly | 65.76 | Fixture `A23`. |
| Very small `p̂` | `x=1, n=1000` | `0.0002` | `0.0056` | 0.55 | Asymmetric interval; Wald would give a negative lower bound. |
| No mentions, large `n` | `x=0, n=1000` | `0` exactly | `0.0038` | 0.38 | `U = z²/(n+z²)` again. |
| `n = 0` | `x=0, n=0` | — | — | — | **Rejected**, `N_BELOW_MIN`. `p̂` undefined; no interval is defined. |
| `x > n` | `x=5, n=4` | — | — | — | **Rejected**, `X_EXCEEDS_N`. Not a binomial outcome. |
| Non-integer `x` or `n` | `x=2.5, n=10` | — | — | — | **Rejected**, `X_NOT_INTEGER`. A run either contained the brand or it did not. |
| `n > 200000` | `x=1, n=200001` | — | — | — | **Rejected**, `N_ABOVE_MAX`. A product cap, not a mathematical one: the formula is fine, but at that scale sampling error is no longer the binding constraint and the tool would be answering the wrong question. |

There is no `n = 1` special case in the code. The formula handles it; only the copy changes.

---

## 4. Mode B: required number of runs

### 4.1 Definition

Given a planning proportion `p`, a target half-width `w` (as a proportion), and a confidence level, the answer is

```
  n* = min { n ∈ ℤ⁺ : h(p, n, z) ≤ w }
```

where `h` is the Wilson half-width from §3.1 evaluated at `p̂ = p` treated as a continuous value — **not** at `p̂ = round(pn)/n`. Evaluating at the continuous `p` is what makes `h` a smooth, strictly decreasing function of `n`, which in turn makes `n*` well defined and binary-searchable.

Computed by exponential bracketing followed by binary search:

```
  hi ← 1;  while h(p, hi, z) > w:  hi ← 2·hi
  lo ← 1
  while lo < hi:
      mid ← ⌊(lo + hi) / 2⌋
      if h(p, mid, z) ≤ w:  hi ← mid  else:  lo ← mid + 1
  return lo
```

Terminates in at most 64 iterations for any input in range (PRD §9.2). The largest reachable answer is `n* = 66,343`, at `p = 0.5, w = 0.005, 99%` (fixture `B15`).

### 4.2 Monotonicity, verified not assumed

The search is only valid if `h(p, n, z)` is strictly decreasing in `n`. This was checked exhaustively by brute force over `p ∈ {0, 0.01, 0.05, 0.1, 0.25, 0.42, 0.5, 0.75, 0.9, 0.97, 0.99, 1}` × the four confidence levels × `n = 1 … 20,000`: **zero violations**, in `scripts/monotonicity.py`. The property test in PRD §10 gate 5 re-checks a random subset on every commit. Minimality is additionally asserted directly for every Mode B fixture, by confirming `h(n*) ≤ w` and `h(n* − 1) > w`.

### 4.3 Why not the closed form

The textbook answer is the Wald-derived `n = z²p(1−p)/w²`. It is wrong in both directions, and the direction depends on `p`:

| `p` | `w` | conf | Wilson `n*` | Wald closed form | Wald error |
|---|---|---|---|---|---|
| 0.50 | 0.05 | 95% | **381** | 385 | over-sizes by 4 |
| 0.42 | 0.05 | 95% | **371** | 375 | over-sizes by 4 |
| 0.10 | 0.05 | 95% | **141** | 139 | under-sizes by 2 |
| 0.05 | 0.05 | 95% | **83** | 73 | **under-sizes by 10 — 12%** |
| 0.05 | 0.01 | 95% | **1838** | 1825 | under-sizes by 13 |
| 0.00 | 0.05 | 95% | **35** | 0 | returns zero, which is not an answer |

At `p = 0`, the closed form returns 0 because `p(1−p) = 0`. Since "we have never been mentioned" is a common real input, that is a shipping-blocker on its own. Under-sizing at small `p` matters most because small `p` is exactly the regime where an emerging brand is trying to plan a budget.

Note that at `p = 0` the *half-width* target is not the natural question. Because `L = 0` when `x = 0`, the informative quantity is the upper bound alone, which admits its own closed form:

```
  U = z² / (n + z²)  ≤  U_target   ⟺   n ≥ z²(1 − U_target) / U_target
```

At 95%: `U_target = 0.05` gives `n = 73`; `U_target = 0.01` gives `n = 381`. Both verified in `scripts/verify_fixtures.py`. These two numbers appear in the `ZERO_MENTIONS` interpretation string (PRD §5.5).

### 4.4 Behaviour at extremes

`p = 0` and `p = 1` are accepted and give identical answers, since `h` is symmetric about `p = 0.5`. `w = 50` points gives `n* = 1` at `p = 0.5`. The floor `w = 0.5` points is a product decision, not a mathematical limit; it caps `n*` at 66,343 and keeps the answer inside the range where sampling error plausibly dominates model drift.

---

## 5. Clustered sampling and the design effect

### 5.1 The three designs are different studies, not different variances

| Design | What was done | What the interval estimates | What it does **not** estimate |
|---|---|---|---|
| `single` | One prompt, run `n` times | The appearance probability **of that one prompt** | Your visibility in general. Your `n` runs are one draw from prompt space, so no amount of `n` fixes this. |
| `distinct` | `n` different prompts, run once each | The appearance rate **across the population your prompts were drawn from** | Anything about a specific prompt. Also: if prompts were hand-picked, the population is "prompts you would think of", not "prompts buyers use". |
| `mixed` | About `K = n/R` prompts, `R` runs each | The appearance rate across the prompt population, with correlated observations | Same caveats as `distinct`, plus the estimate now depends on `ρ`. |

This distinction is the one most often collapsed in practice, and collapsing it is not a variance error but a **claim error**: `single` at `n = 500` produces a tight interval around a quantity nobody cares about. The product therefore states the claim scope in copy for every design (PRD §5.7) rather than only adjusting arithmetic.

The product **refuses** nothing. It computes an interval for all three designs and restricts the claim in prose. Refusing `mixed` would remove the design that vendor dashboards actually use, which is the main thing users come to check.

### 5.2 Design effect

For clustered sampling with average cluster size `R` and intracluster correlation `ρ`:

```
  D      = 1 + (R − 1)ρ
  n_eff  = n / D
```

**Source:** Kish, L. (1965), *Survey Sampling*, Wiley — the origin of `deff`. The `1 + (m−1)ρ` form for equal-sized clusters is standard; see Killip, S., Mahfoud, Z. & Pearce, K. (2004), "What Is an Intracluster Correlation Coefficient? Crucial Concepts for Primary Care Researchers," *Annals of Family Medicine* 2(3): 204–208, [PMC1466680](https://pmc.ncbi.nlm.nih.gov/articles/PMC1466680/).

The interval is then the Wilson interval evaluated at `p̂ = x/n` with `n` replaced by `n_eff`. Because §3.1 is a continuous function of `n`, non-integer `n_eff` needs no special handling — there is one code path, and `ρ = 0` reduces to `D = 1` and `n_eff = n` exactly, so the unadjusted case is not a separate branch. Fixture `D05` asserts that identity.

For Mode B, the requirement inflates: `n*_adjusted = ⌈n* · D⌉`, where `n*` is the independent-observation requirement from §4.1. Fixtures `N01`–`N03`.

**Caveat stated in the product, not only here:** `R` is used as the *average* cluster size. With unequal clusters, `1 + (R̄ − 1)ρ` understates the design effect; the exact form depends on the distribution of cluster sizes. Since the tool takes a single average, its adjustment is a first-order approximation, and it errs toward intervals that are too narrow.

### 5.3 Worked design-effect example

`x = 21, n = 50, R = 50, ρ = 0.2, 95%` — one prompt run 50 times, assuming a fifth of the variance is between-prompt:

```
  D      = 1 + (50 − 1)(0.2) = 10.8
  n_eff  = 50 / 10.8         = 4.6296…
  p̂      = 21/50             = 0.42
  L, U   = 0.1219, 0.7906     (fixture D02)
```

Fifty runs of one prompt, at `ρ = 0.2`, carry about as much information as **4.6** independent observations. The interval goes from 26.4 points wide to 66.9. Whether `ρ = 0.2` is right is unknown (§7); that the answer is this sensitive to it is the finding.

---

## 6. The independence problem, stated in the critic's terms

A binomial interval assumes `n` independent, identically distributed Bernoulli trials. Repeated LLM queries violate this, and the violations are not hypothetical:

- **Provider-side caching.** Identical prompts within a short window may return correlated or identical completions. The SparkToro/Gumshoe methodology FAQ explicitly flags this as an open question they did not test exhaustively.
- **Session and conversation state.** Runs in one session are conditioned on prior turns. Runs by one user are conditioned on that account's memory and personalisation settings.
- **Batching and temporal clustering.** Runs issued in a burst share a model version, a routing decision, and a serving configuration. Runs a week apart may not share a model at all.
- **Non-stationarity.** The parameter `θ` is not fixed. Providers update models continuously, so a long collection period estimates a time-average of a moving target rather than a constant.
- **Prompt-level clustering.** Runs of one prompt are more like each other than like runs of another prompt — §5.2.

Any one of these makes the true sampling variance larger than binomial. The direction of the error is therefore known even when its size is not: **the interval is too narrow.**

### The product decision

Three mechanisms, together. The reasoning is in PRD ADR-8; the statistical content is:

1. **Every interval is framed as a lower bound on total uncertainty**, in permanent non-dismissible copy (`GLOBAL_LOWER_BOUND`). This is the honest framing because the direction of the bias is known: correlation inflates variance, so the binomial interval is the narrowest defensible answer. Not "approximately right" — a floor.
2. **`ρ` is a user-settable inflation factor**, defaulting to 0, with copy stating that 0 is the optimistic extreme. This puts the assumption in the hands of the person who knows how the data was collected, and makes it visible rather than embedded.
3. **The clustered design forces a sensitivity strip** showing the interval at `ρ = 0, 0.05, 0.1, 0.2`, so a user who never touches the control still sees how much the assumption is carrying.

**What was rejected.** Estimating `ρ` from the user's inputs is impossible — the design-effect calculation needs within-cluster and between-cluster variation, and the tool receives only a total count. Requiring `ρ` would force users to invent a number and then trust the output *more* for having entered it. Baking in a default `ρ > 0` would embed an unpublished guess of ours into every interval the product ever reports. Doing nothing and footnoting independence is what the rest of the category does.

### What would falsify the approach

If it turns out that the dominant correlation structure is not exchangeable-within-cluster — for example if runs are strongly autocorrelated in time but nearly independent across sessions — then `1 + (R−1)ρ` is the wrong inflation model and a different variance estimator is needed, not a different `ρ`. Nothing in the current evidence base distinguishes these cases. This is the strongest available objection to the tool and it is stated on `/method` in these words.

---

## 7. Assumptions, and what is flagged for human review

| # | Item | Status |
|---|---|---|
| 1 | `ρ` preset values `0.05, 0.1, 0.2` | **ASSUMPTION — FLAGGED FOR HUMAN REVIEW.** No published study we could find reports an intracluster correlation for repeated LLM prompt runs. These presets are plausible magnitudes borrowed from the range commonly seen in clustered survey and primary-care research; they are **not** measured for this domain. They must be labelled as inputs everywhere they appear, and PRD Phase 13 exists to replace them with a measurement. A statistician reviewing this document should treat these three numbers as the weakest content in it. |
| 2 | Average cluster size used in place of the true cluster-size distribution (§5.2) | **ASSUMPTION.** First-order approximation; errs toward narrower intervals. Acceptable because the exact form needs data the tool does not receive. |
| 3 | `θ` constant over the collection period | **ASSUMPTION, known false.** Models change. Mitigated only by copy (`GLOBAL_LOWER_BOUND`), not by arithmetic. No adjustment is proposed, because estimating drift needs timestamps the tool does not have. |
| 4 | Width thresholds 8 / 15 / 30 points (PRD §5.4) | **PRODUCT JUDGEMENT, not a statistical result.** Labelled as such in the PRD and on `/method`. |
| 5 | Budget thresholds 100 / 500 / 2000 runs (PRD §5.6) | **PRODUCT JUDGEMENT.** As above. |
| 6 | `n ≤ 200,000` and `w ≥ 0.5` points | **PRODUCT CAPS,** not mathematical limits. Stated in §3.4 and §4.4. |
| 7 | Wilson interval, z constants, design-effect formula, required-runs search | **VERIFIED.** Sourced in §2, §3.1, §4, §5.2; reproduced by `scripts/verify_fixtures.py` (457 assertions) against SciPy, statsmodels, and a numerical solution of the defining equation. |

Items 1 and 3 are the two places where a hostile expert should push, and both are stated in the product's own copy before a critic can raise them.

---

## 8. Worked example, computed by hand

**Input:** `x = 4` mentions, `n = 10` runs, 95% confidence, `single` design, `ρ = 0`.

```
  p̂  = 4 / 10 = 0.4
  z  = 1.959963984540054
  z² = 3.8414588206941245
```

Step 1 — denominator:
```
  z²/n = 3.8414588206941245 / 10 = 0.38414588206941245
  1 + z²/n = 1.3841458820694124
```

Step 2 — centre:
```
  z²/(2n) = 0.19207294103470623
  p̂ + z²/(2n) = 0.5920729410347062
  centre = 0.5920729410347062 / 1.3841458820694124 = 0.42775327998628893
```

Step 3 — half-width:
```
  p̂(1 − p̂)/n = (0.4)(0.6)/10 = 0.024
  z²/(4n²)    = 3.8414588206941245 / 400 = 0.009603647051735311
  sum         = 0.03360364705173531
  √sum        = 0.1833129485559604
  z/(1 + z²/n)= 1.959963984540054 / 1.3841458820694124 = 1.4159683988269324
  h           = 1.4159683988269324 × 0.1833129485559604 = 0.2595729502800528
```

Step 4 — bounds, then snap-then-clamp (`p̂` is neither 0 nor 1, so no snapping applies):
```
  L = 0.42775327998628893 − 0.2595729502800528 = 0.16818032970623613
  U = 0.42775327998628893 + 0.2595729502800528 = 0.68732623026634173
```

Step 5 — presentation:
```
  L → roundHalfUp(0.16818032970623613 × 1000)/10 = ⌊168.18…+0.5⌋/10 = 16.8%
  U → roundHalfUp(0.68732623026634173 × 1000)/10 = ⌊687.32…+0.5⌋/10 = 68.7%
  W  = (0.68732623026634173 − 0.16818032970623613) × 100 = 51.9146 → 51.9 points
```

**Result:** 4 of 10 runs is 40.0%, and the 95% Wilson interval is **16.8% to 68.7%** — 51.9 percentage points wide. Class `WIDTH_UNUSABLE`. This is fixture `A01`, and it is the product's landing state, because the argument for the product's existence is a single screen of it.

Cross-checks on the same input: `scipy` + `brentq` on the defining equation gives `0.168180329706236` / `0.687326230266342`; `statsmodels.stats.proportion.proportion_confint(4, 10, method="wilson")` agrees to `1e-10`; Clopper–Pearson gives the wider `12.2%–73.8%`; Wald gives `9.6%–70.4%`, which is the source of the widely-quoted "±30 points" figure and is not a defensible interval at this `n`.

---

## 9. Sources

1. Wilson, E. B. (1927). Probable Inference, the Law of Succession, and Statistical Inference. *JASA* 22(158): 209–212. — the interval.
2. Brown, L. D., Cai, T. T. & DasGupta, A. (2001). Interval Estimation for a Binomial Proportion. *Statistical Science* 16(2): 101–133. [Project Euclid](https://projecteuclid.org/journals/statistical-science/volume-16/issue-2/Interval-Estimation-for-a-Binomial-Proportion/10.1214/ss/1009213286.full) · [author PDF](http://www-stat.wharton.upenn.edu/~lbrown/Papers/2001a%20Interval%20estimation%20for%20a%20binomial%20proportion%20(with%20T.%20T.%20Cai%20and%20A.%20DasGupta).pdf) — Wald's failure, and the recommendation of Wilson at small `n`.
3. Agresti, A. & Coull, B. A. (1998). Approximate Is Better than "Exact" for Interval Estimation of Binomial Proportions. *The American Statistician* 52(2): 119–126. — considered and rejected, §3.2.
4. Clopper, C. J. & Pearson, E. S. (1934). The Use of Confidence or Fiducial Limits Illustrated in the Case of the Binomial. *Biometrika* 26(4): 404–413. — the reference column in `TEST_FIXTURES.md`.
5. Kish, L. (1965). *Survey Sampling.* Wiley. — design effect.
6. Killip, S., Mahfoud, Z. & Pearce, K. (2004). What Is an Intracluster Correlation Coefficient? *Annals of Family Medicine* 2(3): 204–208. [PMC1466680](https://pmc.ncbi.nlm.nih.gov/articles/PMC1466680/) — `D = 1 + (m−1)ρ`.
7. Newcombe, R. G. (1998). Interval estimation for the difference between independent proportions: comparison of eleven methods. *Statistics in Medicine* 17(8): 873–890. — specified for Phase 10, not used in v1.
8. Fishkin, R. & O'Donnell, P., SparkToro / Gumshoe.ai (27 Jan 2026). [AIs are highly inconsistent when recommending brands or products](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/) — 600 volunteers, 12 prompts, 2,961 runs, Nov–Dec 2025; the 60–100 runs recommendation; the 55–77% appearance figures; the caching open question.
9. `scripts/verify_fixtures.py` in this repository — the executable form of everything above.
