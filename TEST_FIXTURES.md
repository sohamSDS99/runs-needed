# Test Fixtures

**`fixtures/fixtures.json` is the single source of truth** (PRD ADR-9). The tables in this file are generated from it. The TypeScript test suite imports it. `scripts/verify_fixtures.py` and `scripts/verify_fixtures.R` validate it against independent tooling. If a table here disagrees with the JSON, the JSON wins and the table is stale — regenerate it.

**Counts:** 30 Mode A cases · 20 Mode B cases · 6 design-effect Mode A · 3 design-effect Mode B · 15 rejected inputs. `scripts/verify_fixtures.py` runs **457 assertions** across them.

**Tolerances.** Proportions must match to `1e-12` absolute. `requiredRuns` must match exactly — it is an integer and there is no tolerance. The `halfWidthAtNMinus1` column exists so minimality is verifiable by eye as well as by assertion: the half-width at `n` is at or below the target and the half-width at `n − 1` is above it.

**Clopper–Pearson is a reference column, not an expectation.** The implementation does not compute it. It is included so a reviewer can see how much wider the "exact" interval is, and because `binom.test` in R produces it in one line, which makes it the fastest independent sanity check available to a statistician (STATS_SPEC.md §3.2).

---

## How to verify these values independently

### Python — the full harness, 457 assertions

```bash
pip install scipy statsmodels
python3 scripts/verify_fixtures.py
```

Expected final line: `PASS - every fixture reproduced from primary sources`. Every fixture is checked three ways: the closed form recomputed from `scipy.stats.norm.ppf` with no hard-coded `z`; the **defining equation** `|p̂ − θ| = z√(θ(1−θ)/n)` solved numerically with `scipy.optimize.brentq`, which validates the algebra rather than the arithmetic; and `statsmodels.stats.proportion.proportion_confint(method="wilson")` as a third-party implementation.

### Python — one case by hand

```python
from statsmodels.stats.proportion import proportion_confint
proportion_confint(4, 10, alpha=0.05, method="wilson")
# (0.16818032970623614, 0.6873262302663417)   -> fixture A01
```

### R — base R plus jsonlite, no other packages

```bash
Rscript scripts/verify_fixtures.R      # run from the repository root
```

Or one case inline:

```r
x <- 4; n <- 10; z <- qnorm(0.975)
d <- 1 + z^2/n
centre <- (x/n + z^2/(2*n)) / d
half   <- (z/d) * sqrt((x/n)*(1-x/n)/n + z^2/(4*n^2))
c(centre - half, centre + half)
# 0.1681803 0.6873262                        -> fixture A01

binom.test(4, 10)$conf.int                    # Clopper-Pearson reference column
# 0.1215523 0.7376219
```

### Reproducing the two supporting claims in STATS_SPEC.md

```bash
python3 scripts/coverage.py       # section 3.2 coverage table (Wald min coverage 0.0955 at n=10)
python3 scripts/monotonicity.py   # section 4.2, 960,000 points, zero violations
```

---

### Mode A

| ID | Kind | x | n | conf | Wilson lower | Wilson upper | Width (pts) | Result class | Clopper-Pearson (reference only) |
|---|---|---|---|---|---|---|---|---|---|
| A01 | normal | 4 | 10 | 95% | 0.168180329706 | 0.687326230266 | 51.9146 | `WIDTH_UNUSABLE` | 0.121552258 / 0.737621923 |
| A02 | normal | 21 | 50 | 95% | 0.293750033547 | 0.557665582314 | 26.3916 | `WIDTH_DIRECTIONAL` | 0.281882241 / 0.567939565 |
| A03 | normal | 42 | 100 | 95% | 0.327983826744 | 0.517935132970 | 18.9951 | `WIDTH_DIRECTIONAL` | 0.321985539 / 0.522880804 |
| A04 | normal | 13 | 30 | 95% | 0.273774855765 | 0.608026929992 | 33.4252 | `WIDTH_UNUSABLE` | 0.254607550 / 0.625726549 |
| A05 | normal | 5 | 12 | 95% | 0.193260313659 | 0.680488687450 | 48.7228 | `WIDTH_UNUSABLE` | 0.151652230 / 0.723330314 |
| A06 | normal | 210 | 500 | 95% | 0.377509351277 | 0.463710543196 | 8.6201 | `WIDTH_TRACKABLE` | 0.376323074 / 0.464628379 |
| A07 | normal | 420 | 1000 | 95% | 0.389772682159 | 0.450839599199 | 6.1067 | `WIDTH_TIGHT` | 0.389183590 / 0.451288770 |
| A08 | boundary-zero | 0 | 10 | 95% | 0.000000000000 | 0.277532799863 | 27.7533 | `WIDTH_DIRECTIONAL` | 0.000000000 / 0.308497108 |
| A09 | boundary-full | 10 | 10 | 95% | 0.722467200137 | 1.000000000000 | 27.7533 | `WIDTH_DIRECTIONAL` | 0.691502892 / 1.000000000 |
| A10 | boundary-n1-zero | 0 | 1 | 95% | 0.000000000000 | 0.793450685623 | 79.3451 | `WIDTH_UNUSABLE` | 0.000000000 / 0.975000000 |
| A11 | boundary-n1-full | 1 | 1 | 95% | 0.206549314377 | 1.000000000000 | 79.3451 | `WIDTH_UNUSABLE` | 0.025000000 / 1.000000000 |
| A12 | hard-small-p | 1 | 20 | 95% | 0.008881448801 | 0.236131193447 | 22.7250 | `WIDTH_DIRECTIONAL` | 0.001265089 / 0.248732763 |
| A13 | hard-large-p | 19 | 20 | 95% | 0.763868806553 | 0.991118551199 | 22.7250 | `WIDTH_DIRECTIONAL` | 0.751267237 / 0.998734911 |
| A14 | hard-small-p | 3 | 30 | 95% | 0.034599888747 | 0.256210825792 | 22.1611 | `WIDTH_DIRECTIONAL` | 0.021117137 / 0.265288450 |
| A15 | hard-small-p | 2 | 100 | 95% | 0.005501967550 | 0.070011790729 | 6.4510 | `WIDTH_TIGHT` | 0.002431337 / 0.070383932 |
| A16 | hard-large-p | 98 | 100 | 95% | 0.929988209271 | 0.994498032450 | 6.4510 | `WIDTH_TIGHT` | 0.929616068 / 0.997568663 |
| A17 | normal | 500 | 1000 | 95% | 0.469069600368 | 0.530930399632 | 6.1861 | `WIDTH_TIGHT` | 0.468549173 / 0.531450827 |
| A18 | hard-n3 | 1 | 3 | 95% | 0.061491944720 | 0.792340399198 | 73.0848 | `WIDTH_UNUSABLE` | 0.008403759 / 0.905700676 |
| A19 | conf-80 | 4 | 10 | 80% | 0.229565578974 | 0.598648157444 | 36.9083 | `WIDTH_UNUSABLE` | 0.187562297 / 0.645784071 |
| A20 | conf-90 | 4 | 10 | 90% | 0.194226991877 | 0.648361402140 | 45.4134 | `WIDTH_UNUSABLE` | 0.150028241 / 0.696462787 |
| A21 | conf-99 | 4 | 10 | 99% | 0.127930559600 | 0.751840259061 | 62.3910 | `WIDTH_UNUSABLE` | 0.076768169 / 0.809083669 |
| A22 | boundary-zero-n1000 | 0 | 1000 | 95% | 0.000000000000 | 0.003826758486 | 0.3827 | `WIDTH_TIGHT` | 0.000000000 / 0.003682084 |
| A23 | boundary-full-n2 | 2 | 2 | 95% | 0.342380227507 | 1.000000000000 | 65.7620 | `WIDTH_UNUSABLE` | 0.158113883 / 1.000000000 |
| A24 | normal | 69 | 71 | 95% | 0.902984998834 | 0.992240736417 | 8.9256 | `WIDTH_TRACKABLE` | 0.901919931 / 0.996570209 |
| A25 | normal | 85 | 95 | 95% | 0.816979429352 | 0.941811475748 | 12.4832 | `WIDTH_TRACKABLE` | 0.814926343 / 0.948355264 |
| A26 | normal | 36 | 73 | 95% | 0.381708598123 | 0.605277593767 | 22.3569 | `WIDTH_DIRECTIONAL` | 0.374047136 / 0.612827095 |
| A27 | conf-99-large | 500 | 1000 | 99% | 0.459407005212 | 0.540592994788 | 8.1186 | `WIDTH_TRACKABLE` | 0.458852553 / 0.541147447 |
| A28 | hard-tiny-p | 1 | 1000 | 95% | 0.000176546371 | 0.005642558598 | 0.5466 | `WIDTH_TIGHT` | 0.000025317 / 0.005558924 |
| A29 | normal | 4 | 20 | 95% | 0.080657662580 | 0.416017432252 | 33.5360 | `WIDTH_UNUSABLE` | 0.057333997 / 0.436614003 |
| A30 | normal | 6 | 15 | 95% | 0.198244961413 | 0.642531698794 | 44.4287 | `WIDTH_UNUSABLE` | 0.163364324 / 0.677130234 |

### Mode B

| ID | Kind | planning p̂ | target half-width | conf | requiredRuns | half-width at n | half-width at n−1 | Result class |
|---|---|---|---|---|---|---|---|---|
| B01 | normal | 50.0% | 10.0 pts | 95% | **93** | 0.099583510949 | 0.100101684908 | `BUDGET_EASY` |
| B02 | normal | 50.0% | 5.0 pts | 95% | **381** | 0.049954793635 | 0.050019823478 | `BUDGET_REAL` |
| B03 | normal | 42.0% | 5.0 pts | 95% | **371** | 0.049971384455 | 0.050038192830 | `BUDGET_REAL` |
| B04 | normal | 42.0% | 15.0 pts | 95% | **38** | 0.149729188310 | 0.151555621378 | `BUDGET_EASY` |
| B05 | normal | 10.0% | 5.0 pts | 95% | **141** | 0.049995086961 | 0.050176422903 | `BUDGET_REAL` |
| B06 | conf-90 | 50.0% | 10.0 pts | 90% | **65** | 0.099950540487 | 0.100696945666 | `BUDGET_EASY` |
| B07 | conf-99 | 50.0% | 5.0 pts | 99% | **657** | 0.049994528451 | 0.050032238267 | `BUDGET_HEAVY` |
| B08 | conf-80 | 50.0% | 10.0 pts | 80% | **40** | 0.099297507554 | 0.100511684990 | `BUDGET_EASY` |
| B09 | hard-extreme-p | 97.0% | 2.0 pts | 95% | **303** | 0.019973382653 | 0.020008847481 | `BUDGET_REAL` |
| B10 | boundary-p0 | 0.0% | 10.0 pts | 95% | **16** | 0.096803840267 | 0.101941650518 | `BUDGET_EASY` |
| B11 | boundary-p100 | 100.0% | 10.0 pts | 95% | **16** | 0.096803840267 | 0.101941650518 | `BUDGET_EASY` |
| B12 | boundary-w-max | 50.0% | 50.0 pts | 95% | **1** | 0.445379244471 | n/a (n=1) | `BUDGET_EASY` |
| B13 | normal | 50.0% | 25.0 pts | 95% | **12** | 0.246218402366 | 0.254378147139 | `BUDGET_EASY` |
| B14 | boundary-w-floor | 50.0% | 0.5 pts | 95% | **38411** | 0.004999983519 | 0.005000048599 | `BUDGET_UNREALISTIC` |
| B15 | boundary-w-floor-99 | 50.0% | 0.5 pts | 99% | **66343** | 0.004999974797 | 0.005000012476 | `BUDGET_UNREALISTIC` |
| B16 | normal | 42.0% | 2.0 pts | 95% | **2336** | 0.019998751462 | 0.020003026544 | `BUDGET_UNREALISTIC` |
| B17 | hard-small-p | 5.0% | 5.0 pts | 95% | **83** | 0.049974209732 | 0.050310881877 | `BUDGET_EASY` |
| B18 | hard-small-p | 5.0% | 10.0 pts | 95% | **25** | 0.099594264398 | 0.102024261409 | `BUDGET_EASY` |
| B19 | normal | 10.0% | 10.0 pts | 95% | **37** | 0.099401731683 | 0.100822243994 | `BUDGET_EASY` |
| B20 | normal | 75.0% | 10.0 pts | 95% | **70** | 0.099616635864 | 0.100309830328 | `BUDGET_EASY` |

### Design effect, Mode A

| ID | planning p̂ | n | ρ | R (runs/prompt) | conf | D | effective n | Wilson lower | Wilson upper | Width (pts) | Result class |
|---|---|---|---|---|---|---|---|---|---|---|---|
| D01 | 42.0% | 50 | 0.1 | 10 | 95% | 1.900000 | 26.315789474 | 0.253742624261 | 0.606638327121 | 35.2896 | `WIDTH_UNUSABLE` |
| D02 | 42.0% | 50 | 0.2 | 50 | 95% | 10.800000 | 4.629629630 | 0.121937839364 | 0.790618764774 | 66.8681 | `WIDTH_UNUSABLE` |
| D03 | 42.0% | 300 | 0.2 | 30 | 95% | 6.800000 | 44.117647059 | 0.286575533653 | 0.566240247626 | 27.9665 | `WIDTH_DIRECTIONAL` |
| D04 | 42.0% | 100 | 0.1 | 10 | 95% | 1.900000 | 52.631578947 | 0.296600890951 | 0.554282770272 | 25.7682 | `WIDTH_DIRECTIONAL` |
| D05 | 42.0% | 50 | 0.0 | 50 | 95% | 1.000000 | 50.000000000 | 0.293750033547 | 0.557665582314 | 26.3916 | `WIDTH_DIRECTIONAL` |
| D06 | 50.0% | 1000 | 0.05 | 20 | 95% | 1.950000 | 512.820512821 | 0.456886344528 | 0.543113655472 | 8.6227 | `WIDTH_TRACKABLE` |

### Design effect, Mode B

| ID | planning p̂ | target | conf | ρ | R | D | base n | requiredRuns = ceil(base × D) |
|---|---|---|---|---|---|---|---|---|
| N01 | 50.0% | 10.0 pts | 95% | 0.1 | 10 | 1.900000 | 93 | **177** |
| N02 | 42.0% | 5.0 pts | 95% | 0.2 | 20 | 4.800000 | 371 | **1781** |
| N03 | 50.0% | 5.0 pts | 95% | 0.0 | 10 | 1.000000 | 381 | **381** |

### Rejected inputs

| ID | Mode | Input | Expected errorCode |
|---|---|---|---|
| R01 | A | x=5, n=4, conf=95 | `X_EXCEEDS_N` |
| R02 | A | x=-1, n=10, conf=95 | `X_NEGATIVE` |
| R03 | A | x=2, n=0, conf=95 | `N_BELOW_MIN` |
| R04 | A | x=2.5, n=10, conf=95 | `X_NOT_INTEGER` |
| R05 | A | x=2, n=10.5, conf=95 | `N_NOT_INTEGER` |
| R06 | A | x=2, n=10, conf=97 | `CONF_NOT_ALLOWED` |
| R07 | A | x=2, n=200001, conf=95 | `N_ABOVE_MAX` |
| R08 | B | planningPct=50, targetHalfWidthPts=0.4, conf=95 | `TARGET_BELOW_MIN` |
| R09 | B | planningPct=50, targetHalfWidthPts=50.1, conf=95 | `TARGET_ABOVE_MAX` |
| R10 | B | planningPct=100.1, targetHalfWidthPts=5, conf=95 | `PLANNING_OUT_OF_RANGE` |
| R11 | B | planningPct=-0.1, targetHalfWidthPts=5, conf=95 | `PLANNING_OUT_OF_RANGE` |
| R12 | A | x=2, n=10, conf=95, rho=0.95 | `RHO_OUT_OF_RANGE` |
| R13 | A | x=2, n=10, conf=95, rho=-0.01 | `RHO_OUT_OF_RANGE` |
| R14 | A | x=2, n=10, conf=95, design=mixed, runsPerPrompt=0 | `RUNS_PER_PROMPT_BELOW_MIN` |
| R15 | A | x=2, n=10, conf=95, design=mixed, runsPerPrompt=11 | `RUNS_PER_PROMPT_EXCEEDS_N` |

---

## Notes on specific fixtures

| Fixture | Why it is in the set |
|---|---|
| `A01` (4/10) | The landing state and the product's whole argument in one row: 51.9 points wide. Also the §8 worked example in `STATS_SPEC.md`. |
| `A08`, `A22` (x = 0) | Lower bound must be **exactly** `0.0`, not `2e-19`. Catches a clamp-only implementation (STATS_SPEC.md §3.3). |
| `A09`, `A11`, `A23` (x = n) | Upper bound must be **exactly** `1.0`. Same defect class, opposite end. |
| `A10`, `A11` (n = 1) | The formula must not special-case `n = 1`; only the copy changes. |
| `A12`, `A13`, `A15`, `A16`, `A28` | Small and large `p̂`, where Wald produces bounds outside `[0, 1]` and Wilson must not. |
| `A19`–`A21`, `A27` | The same input at all four confidence levels, so a wrong `z` constant fails loudly. |
| `A24`, `A25`, `A26` | Real figures from the SparkToro/Gumshoe study: City of Hope 69/71, Smartsites 85/95, Adam Gallagher 36/73. If the tool cannot reproduce published numbers it is not usable on published numbers. |
| `B10`, `B11` (p = 0, p = 100) | The Wald closed form returns 0 here. The search must return 16. Both must give the same answer, since the half-width is symmetric about 0.5. |
| `B12` (w = 50) | The loosest permitted target; answer is `n = 1`, and `halfWidthAtNMinus1` is `null` rather than an error. |
| `B14`, `B15` (w = 0.5) | The tightest permitted target and the largest reachable answer, 66,343 at 99%. Bounds the binary search's iteration count. |
| `B17` (p = 5, w = 5) | The case where the Wald closed form under-sizes by 12% (73 against 83). If an implementation was quietly rewritten to the closed form, this row catches it. |
| `D05` (ρ = 0) | Asserts that `ρ = 0` reduces exactly to the unadjusted interval, so the design-effect path is not a separate branch. |
| `D02` | Fifty runs of one prompt at ρ = 0.2 carry the information of 4.63 independent observations. The sensitivity finding in `STATS_SPEC.md` §5.3. |
| `R01`–`R15` | Every validation rule in PRD §4.2 and §4.3, each mapped to its exact `errorCode`. The UI must surface the first failure in the documented order, so these also pin the ordering. |
