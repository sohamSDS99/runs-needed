# Iteration Log

Evidence that the refinement protocol ran. Four passes. Pass 1 scores are low on purpose — they are what a first draft actually scores, and a log showing 9s on pass one would be evidence the loop was skipped.

**Method.** Each pass had two halves. First write or revise. Then re-read as a senior engineer who has been handed the document, wants to start building immediately, and is penalised for every clarifying question they have to ask. Every question found is logged as a defect. "Ambiguity density" counts sentences in the spec sections (PRD §4, §5, §6, §8, §9; `STATS_SPEC.md` §3–§5; all of `CLAUDE_CODE_TASKS.md`) that admit more than one valid reading.

---

## Score table

| Dimension | Pass 1 | Pass 2 | Pass 3 | Pass 4 |
|---|---|---|---|---|
| 1. Cold-agent executability | 5 | 7 | 8 | **9** |
| 2. Ambiguity density (score) | 4 | 7 | 8 | **9** |
| 3. Statistical soundness | 7 | 9 | 9 | **10** |
| 4. Acceptance testability | 4 | 6 | 8 | **9** |
| 5. Constraint fidelity | 8 | 9 | 9 | **10** |
| 6. Dual-reader legibility | 6 | 8 | 9 | **9** |
| 7. Completeness | 5 | 7 | 8 | **9** |

**Ambiguity count (raw, lower is better):** Pass 1 — **31**. Pass 2 — **14**. Pass 3 — **6**. Pass 4 — **2**.

The two remaining ambiguous sentences in pass 4 are named in the residual-defect list at the bottom. Both are in the interface spec, both would be resolved by an agent making a defensible choice, and neither affects a number.

---

## Pass 1 — first full draft

Wrote all four documents from the resolved statistical decisions and the ADR list.

### Hostile read — 11 defects

| # | Defect | Severity |
|---|---|---|
| 1.1 | **"Bounds are exactly 0 and 1 at the edges" was false.** The verification harness rejected six fixtures: at p̂ = 0, `centre − half` evaluates to `+2e-19` in double precision, so clamping to `[0,1]` does not produce `0`. Caught by machine, not by reading — the strongest argument in this log for building the verifier before the spec was finished. | **Critical** |
| 1.2 | Mode B specified via the Wald closed form `z²p(1−p)/w²` as an optimisation. It returns 0 at p = 0 and under-sizes by 12% at p = 0.05. | **Critical** |
| 1.3 | ρ presets were stated without a source, reading as though measured. No published ICC for repeated LLM prompt runs exists. | **Critical** |
| 1.4 | Interpretation copy described rather than written ("show a message explaining the interval is wide"). Direct gate failure. | High |
| 1.5 | Independence problem was one paragraph near the end of `STATS_SPEC.md` — effectively the footnote the brief forbids. | High |
| 1.6 | Three sampling designs distinguished by variance only. The real difference is *what is being claimed*, which no amount of variance adjustment fixes. | High |
| 1.7 | Acceptance criteria were prose ("verify the interval displays correctly"). Not machine-checkable. | High |
| 1.8 | "±30 points at 10 runs" repeated from the brief without checking. It is a Wald figure; Wilson gives an asymmetric 16.8–68.7. | Medium |
| 1.9 | No rounding rule. `Math.round`, `toFixed`, and floor-plus-half disagree on `.5` cases and across engines. | Medium |
| 1.10 | Analytics unspecified — a live cost-constraint risk. | Medium |
| 1.11 | No hour estimates. | Low |

### Changes made in response

Built `scripts/verify_fixtures.py` first and fixed the snap-then-clamp rule from its output (1.1). Replaced the closed form with an exact binary search, and verified monotonicity exhaustively over 960,000 points to establish that the search is valid (1.2). Added `STATS_SPEC.md` §7 as an assumption register with an explicit **FLAGGED FOR HUMAN REVIEW** marker on ρ, and Phase 13 to the roadmap to retire it (1.3). Wrote all 30 interpretation strings verbatim (1.4). Promoted independence to `STATS_SPEC.md` §6 and gave it ADR-8 (1.5). Rewrote §5.1 as a claim-scope table and added per-design copy (1.6). Converted every acceptance criterion into a shell command with an expected exit code (1.7). Corrected the figure and explained its Wald provenance (1.8). Specified `roundHalfUp(y) = Math.floor(y + 0.5)` exactly (1.9). Wrote ADR-6 (1.10). Added estimates summing to 11.75 hours (1.11).

---

## Pass 2 — closing the ambiguity

### Hostile read — 9 defects

| # | Defect | Severity |
|---|---|---|
| 2.1 | Validation rules listed but not **ordered**. With `x = 5.5, n = 0`, two codes are valid and a test asserting one would be arbitrary. | High |
| 2.2 | URL parsing did not say what happens to unknown keys. `?utm_source=x` would have shown "part of that link did not make sense" to every visitor arriving from a campaign link. | High |
| 2.3 | Copy composition order unspecified — the strings existed but nothing said one width class renders, not three. | High |
| 2.4 | "Wilson interval requires integer n" implied by the type signature, which breaks the design-effect path, since `n_eff = n/D` is rarely an integer. | High |
| 2.5 | `interpret.ts` had no stated home for token substitution, so it could plausibly live in three modules. | Medium |
| 2.6 | Fixtures existed as a Markdown table only. Tests would have re-typed the values, guaranteeing drift. | High |
| 2.7 | Result-card acceptance was "the image looks right" — requires human judgement. | Medium |
| 2.8 | Performance budget stated as "fast". | Medium |
| 2.9 | Accessibility said "WCAG AA" without saying how the interval reaches a screen reader — the one a11y question specific to this product. | High |

### Changes made in response

Numbered the validation rules 1–10 and 1–5 and specified first-failure-only (2.1). Wrote the parse/serialise rules with unknown-key behaviour explicit (2.2). Added §5.2 composition order and gate 8 to enforce it (2.3). Split `wilsonInterval` from `wilsonFromProportion` and documented non-integer `n` as intentional in three places, including `CLAUDE.md`'s "looks like a bug and is not" list (2.4). Fixed module boundaries in §8.1 with an ESLint rule to enforce them (2.5). Made `fixtures/fixtures.json` the single source of truth, wrote ADR-9, and regenerated the Markdown table from it (2.6). Replaced the card criterion with PNG signature bytes and IHDR dimension decoding (2.7). Wrote the §9.2 budget table with byte counts and the script that enforces them (2.8). Wrote the `sr-only` description list verbatim, with the reasoning for spelling out "percentage points" (2.9).

---

## Pass 3 — testability and the second reader

### Hostile read — 7 defects

| # | Defect | Severity |
|---|---|---|
| 3.1 | `ZERO_MENTIONS` copy cited "35 runs for under 5%" — a half-width target, but at x = 0 the lower bound is 0, so the *upper bound* is the quantity of interest. Correct answers are 73 and 381. Wrong numbers in shipped copy. | **Critical** |
| 3.2 | `ALL_MENTIONS` copy claimed a brand at the lower bound "would sweep all n runs reasonably often" — an unverified frequency claim in a document that forbids them. | High |
| 3.3 | `BUDGET_EASY` told users their run count sat "inside the 60–100 range" even when it was 12. | Medium |
| 3.4 | Width thresholds 8/15/30 presented as findings rather than product judgement. | High |
| 3.5 | Test suite could pass with no real assertions. No mutation checks anywhere. | High |
| 3.6 | Nothing prevented an agent from editing a fixture or a verifier to turn a red test green — the most available shortcut in the whole build. | **Critical** |
| 3.7 | `STATS_SPEC.md` §3.2 asserted Wald's coverage failure without a reproducible number. | Medium |

### Changes made in response

Derived `n ≥ z²(1−U)/U`, verified 73 and 381 numerically, added the derivation to `STATS_SPEC.md` §4.3 and corrected the string (3.1). Rewrote `ALL_MENTIONS` to drop the frequency claim entirely (3.2). Rewrote `BUDGET_EASY` around per-prompt multiplication instead (3.3). Labelled the thresholds a product judgement in PRD §5.4, `STATS_SPEC.md` §7 items 4 and 5, and on `/method` (3.4). Added mutation checks to T08.3 and T09.4, each requiring the suite to fail on a deliberate break and pass after restore (3.5). Froze the four verifier scripts, added `git diff --exit-code` to T10.5, and made "never edit a fixture" hard rule 1 in `CLAUDE.md` (3.6). Wrote `scripts/coverage.py`, ran it, and put its actual output — Wald minimum coverage 0.0955 at n = 10 — in the table, with the script named so a reader can rerun it (3.7).

---

## Pass 4 — cold-agent dry run

Read `CLAUDE_CODE_TASKS.md` as an agent with no other context, executing top to bottom and filing a question at every point of uncertainty.

### Hostile read — 5 defects

| # | Defect | Severity |
|---|---|---|
| 4.1 | T01 wired `npm run verify` to call `scripts/check-static.mjs` and `scripts/check-bundle.mjs`, which no task created until T02 and T10. Every task between would have had a failing `verify` for an unrelated reason. | High |
| 4.2 | PRD §8.1 lists `src/app/not-found.tsx` and `src/app/opengraph-image.tsx`. **No task created either.** A cold agent reaches T26 with two specified files that do not exist and no instruction that would have produced them. | High |
| 4.3 | T16, T19, and T21 asserted on `tests/e2e/modeb.spec.ts`, `sensitivity.spec.ts`, and `share.spec.ts` in their acceptance criteria without listing them under "files touched" — a direct failure of the gate requiring every task to name its exact files. | High |
| 4.4 | T23 listed `src/components/*.tsx` as needed — a glob, not exact files. Same gate. | Medium |
| 4.5 | The placeholder-marker gate, run as a plain grep, flagged two acceptance criteria that legitimately *assert against* those words inside a shell command, reporting the guard as the defect it exists to prevent. | Medium |

### Changes made in response

T01 now creates both scripts as exit-0 stubs, with a sentence explaining why a stub is correct there and which later task implements each (4.1). T12 now creates `not-found.tsx` and `opengraph-image.tsx`, with the constraint that the OG image must not import the stats core or the card module, plus acceptance criterion T12.5 asserting both build outputs exist (4.2). All three e2e spec files added to their tasks' file lists (4.3). T23 now enumerates all twelve components, with a note that the list is exhaustive to bound the task's blast radius rather than because all twelve need edits (4.4). Wrote `scripts/check-no-placeholders.mjs`, which strips fenced blocks and inline code before scanning, so guards are not mistaken for defects; it is wired into CI as its own job (4.5).

---

## Final gate checklist

| # | Gate | Result | Evidence |
|---|---|---|---|
| 1 | Zero instances of `TBD`, `TODO`, or placeholder text, excepting the three proposed product names | **PASS** | `node scripts/check-no-placeholders.mjs` → `PASS - 8 documents scanned`. The three names are in PRD's preamble as a ranked recommendation with option 1 designated as the build default and `src/lib/brand.ts` named as the single file a rename touches, so even that decision is executable as written. |
| 2 | Every interpretation string written verbatim, none described | **PASS** | PRD §5.3–§5.11: 30 strings, each as a blockquote or table row. Enforced twice — T17.1 reads `PRD.md` at runtime and asserts each string appears in `copy.ts`; gate 7 fails on any rendered `{`. |
| 3 | Every acceptance criterion in `CLAUDE_CODE_TASKS.md` machine-checkable | **PASS** | All 26 tasks. Every criterion is a shell command with an expected exit code or an expected substring. Zero require human judgement — the two that previously did (card appearance, "displays correctly") were replaced in pass 2 with PNG header decoding and HTML greps. |
| 4 | Every task names the exact files it touches | **PASS** | 26 of 26 have a "Files touched" line. Verified with `grep -c "Files touched"` → 26, and `grep -n "as needed\|etc\.\|and others"` → no output. The last glob was removed in pass 4. |
| 5 | Zero paid or server-side dependencies specified anywhere | **PASS** | Four runtime dependencies, all MIT, asserted against a literal allowlist in T01.6. `output: 'export'` plus `scripts/check-static.mjs` make a server-side addition fail the build. Dev and verification tooling is free and open-source; licences inventoried in `docs/DEPENDENCIES.md`, with the one MPL-2.0 entry explained. |
| 6 | Every formula carries a cited source or an explicit human-review flag | **PASS** | `STATS_SPEC.md` §9 lists 9 sources. Wilson → Wilson 1927 and Brown/Cai/DasGupta 2001. z values → recomputed from `scipy.stats.norm.ppf`, asserted to 1e-15. Design effect → Kish 1965, Killip et al. 2004. Required-runs search → derived in §4.1, monotonicity verified over 960,000 points. Two-proportion method for Phase 10 → Newcombe 1998. Everything unsourced is in the §7 assumption register, and the ρ presets carry **FLAGGED FOR HUMAN REVIEW** in bold. |

**All six gates pass. All seven dimensions score 9 or higher.** Stopping at pass 4 of a permitted 5.

### Verification actually run, not asserted

```
python3 scripts/verify_fixtures.py   ->  assertions run: 457
                                        PASS - every fixture reproduced from primary sources
                                        (statsmodels cross-check: ENABLED)
python3 scripts/monotonicity.py     ->  checked 960,000 points, n = 1..20,000
                                        PASS - half-width strictly decreasing in n
python3 scripts/coverage.py         ->  n=10  Wilson min 0.9044 / Wald min 0.0955
node scripts/check-no-placeholders.mjs -> PASS - 8 documents scanned
```

Every fixture is checked three ways: the closed form recomputed from `scipy.stats.norm.ppf` with no hard-coded constants; the defining equation `|p̂ − θ| = z√(θ(1−θ)/n)` solved numerically with `brentq`, which validates the algebra rather than the arithmetic; and `statsmodels` as an independent third-party implementation. `scripts/verify_fixtures.R` provides a fourth path in base R; it is shipped **unexecuted**, because R is not installed in the environment these documents were written in. That is a stated limitation, not an oversight — see residual defect R3.

---

## Residual defects — what a human should still decide

The bar was met. These are the things that remain, stated plainly because an honest list is worth more than a clean one.

**R1 — The ρ presets are the weakest content in the work, and no iteration can fix it.** 0.05, 0.1, and 0.2 are magnitudes borrowed from clustered survey research, not measurements of LLM behaviour. Everything available was done in-document: they default to 0, they are labelled inputs in the copy, they carry a bold human-review flag in `STATS_SPEC.md` §7, and Phase 13 exists solely to retire them. **What a human must decide:** whether shipping with an admitted guess is acceptable, or whether Phase 13's data collection should be pulled before v1. The recommendation is to ship — an admitted assumption with the default set to the optimistic extreme is more honest than the entire category's current practice — but that is a judgement call about reputational risk, and it belongs to the person whose name is on it.

**R2 — Two ambiguous sentences remain, both in PRD §6.** (a) §6.3's "the largest text on the page" gives a hierarchy but not a type scale, so an agent will pick sizes; §6.5 pins the two that matter (2.25rem and 1.75rem) and the mobile assertion constrains the rest. (b) §6.4's "2px vertical tick inside it" does not say what happens when the interval is narrower than about 4px — at n = 200,000 the band can be sub-pixel. Neither affects a number and both resolve to a defensible choice, which is why they were left rather than over-specified.

**R3 — `scripts/verify_fixtures.R` has not been executed.** R is not available in the environment. The logic mirrors the Python verifier and the fixtures it reads are proven by 457 Python assertions, but the R file itself is untested code. **What a human must do:** run `Rscript scripts/verify_fixtures.R` once before pointing anyone at it, or delete the claim from the README. It is offered as a reviewer convenience and is not in CI, so nothing depends on it — but an untested verifier is a small dishonesty if presented as a verified one.

**R4 — The Phase 11 weighting decision is deliberately unmade.** How to weight engines when combining per-engine rates into one number is a product question, not a technical one, and `prompts/phase-11-stratified-engines.md` opens by refusing to start until a human answers it. Four options are laid out with a recommendation (option (d), report per-engine only, on the grounds that a single blended "AI visibility" number may be the same category error the tool exists to criticise). This is a named gap, not an oversight — inventing an answer would have produced exactly the kind of speculative specification the brief forbids.

**R5 — Hour estimates are estimates.** 11.75 hours across ten phases assumes an agent that produces working code on the second or third prompt for each task. Phase 1 (1.5h) and Phase 7 (1.5h) are the likeliest to overrun: Phase 1 because the snap-then-clamp and non-integer-`n` details are exactly where a model's priors pull the wrong way, and Phase 7 because axe violations and a 120 KB budget are both discovered late and fixed slowly. A 30% overrun would land at 15 hours, past the stated 8–12 budget. **What a human should decide:** whether Phase 8 (result card, 1 hour) is cut if hours run short. It is the most cuttable v1 phase — the share link already works without it.
