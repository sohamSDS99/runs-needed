# Runs Needed — Product Requirements Document (v1)

**Status:** build-ready. Every value in this document is either derived from a formula stated in `STATS_SPEC.md`, cited to a source, or explicitly labelled as an assumption.

**Name.** Three options, in preference order:

1. **Runs Needed** — names the job of Mode B, short, types easily, works as a verb in a sentence ("what does Runs Needed say?").
2. **Visibility Margin** — closer to the language marketers already use ("margin of error").
3. **The AI Visibility Confidence Interval Calculator** — literal, matches search intent, poor as a wordmark.

**The build uses option 1.** Wordmark `Runs Needed`; HTML `<title>` on `/` is `AI Visibility Confidence Interval & Sample Size Calculator — Runs Needed`. Both strings live in `src/lib/brand.ts` and are the only place a rename touches. Canonical base URL is `https://runs-needed.vercel.app` (Vercel Hobby subdomain, free in perpetuity, no custom domain purchased). A human may substitute a different name or domain by editing that one file; nothing else in the build depends on either string.

---

## 1. Problem & thesis

AI visibility platforms report numbers like "42% visibility in ChatGPT." That number is a **binomial proportion** — the share of trials in which something happened — computed from a sample of prompt runs. In practice the sample is small: 10 to 50 runs is typical of what agencies pay for.

A proportion from a small sample carries a large **confidence interval**: the range of true values consistent with what you observed. Observe 4 mentions in 10 runs and the 95% Wilson interval is 16.8% to 68.7% — a 51.9-point span (fixture `A01`, verified in `TEST_FIXTURES.md`). The dashboard shows you "40%." The honest statement is "somewhere between one in six and two in three."

No vendor surfaces this. The reason is structural, not technical: an interval that wide makes the product look broken, and it makes month-over-month movement — the thing customers renew for — visibly meaningless. A vendor cannot ship this feature. A third party can.

The gap is documented. SparkToro and Gumshoe.ai ran 600 volunteers through 12 prompts across ChatGPT, Claude, and Google AI, 2,961 runs total, published January 2026. Their finding: there is a less than 1-in-100 chance that the same prompt returns the same list of brands twice, and less than 1-in-1,000 that it returns the same list in the same order. Yet appearance *frequency* held stable — across 994 responses to 142 differently-worded headphone prompts, Bose, Sony, Sennheiser and Apple each appeared 55–77% of the time. Their recommendation was to run each prompt "at least 60–100X, then average these out."

Their own closing section asks the question nobody answered: *"How many times do you need to run a prompt to have statistically sound answers about a brand's relative visibility?"* The industry response to the research was "run more prompts." Nobody shipped the tool that says how many. That is this product, and it is roughly 200 lines of arithmetic.

What this implies about the category: AI visibility tracking is being sold at a precision the sampling cannot support, and the correction will not come from inside the category. A free calculator that converts any vendor's number into an interval is a permanent, unpatchable audit of every dashboard in the market.

**Sources:** [SparkToro / Gumshoe research, 27 Jan 2026](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/) · [Search Engine Journal coverage](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242/)

---

## 2. Users & jobs

| Persona | Job they hire the tool for | Moment of use |
|---|---|---|
| **Agency / consultant** (primary) | Justify a larger prompt budget, or answer "your number moved 4 points, what happened?" without conceding incompetence | Live on a client call, screen shared or on a phone under the table. Needs an answer in under 15 seconds and a link they can paste into the chat. |
| **In-house marketer evaluating a vendor** | Decide whether a dashboard number means anything before signing | Alone, during a trial, with the vendor's number in front of them. Types it in to see what it's actually worth. |
| **Skeptic / practitioner** | Check the math, then post about it | Reading the method page before the calculator. Biggest risk and the entire distribution engine. |

Design consequences of the three, in order: the agency case forces **mobile-capable, shareable-by-URL, fast**. The evaluator case forces **no signup, no email gate** — anything that interrupts loses them. The skeptic case forces **the method to be a first-class page, the stats core to be readable and vendorable, and the independence problem to be confronted on the front page rather than defended in a reply**.

---

## 3. Non-goals

This product will never:

1. Run prompts, call an LLM API, or measure anything itself. It is arithmetic on numbers you already have.
2. Have a backend, a database, accounts, logins, saved history, or an email capture.
3. Store, transmit, or log the figures a user types. See ADR-1 and §9.
4. Rank, score, or grade a brand's visibility.
5. Tell a user their vendor is wrong. It reports the interval; the reader draws the conclusion.
6. Support arbitrary confidence levels. Four fixed levels only (ADR-4).
7. Offer a Bayesian credible interval, a posterior, or a prior-elicitation flow. Out of scope permanently — it doubles the interpretation surface for an audience that does not have priors to elicit.
8. Charge money, run ads, or gate a feature.
9. Claim to correct for non-independence. It exposes the assumption and lets the user inflate the interval; it does not estimate the correlation for them (§5, ADR-8).

---

## 4. v1 functional spec

Two modes on one page, switched by a segmented control. Mode state is in the URL (`m=a` / `m=b`). No routing between them; both render into the same result region.

### 4.1 Shared inputs

| Input | Control | Allowed values | Default | URL key |
|---|---|---|---|---|
| Confidence level | Select, 4 options | `80`, `90`, `95`, `99` | `95` | `c` |
| Sampling design | Radio, 3 options | `single`, `distinct`, `mixed` | `single` | `d` |
| Intracluster correlation ρ | Number input, step 0.05, plus preset buttons `0`, `0.05`, `0.1`, `0.2` | `0` to `0.9` inclusive | `0` | `r` (stored as ρ×100, integer) |
| Average runs per prompt R | Number input, shown only when design = `mixed` | integer `1` to `n` | `10` | `k` |

`single` = one prompt run N times. `distinct` = N different prompts run once each. `mixed` = several prompts, several runs each.

ρ and R are collapsed behind a disclosure labelled **"Adjust for repeat-run correlation (advanced)"**, expanded automatically when design = `mixed`.

### 4.2 Mode A — given mentions and runs, return the interval

**Inputs**

| Input | Control | Validation | Default | URL key |
|---|---|---|---|---|
| Mentions | `<input type="number">` | integer, `0 ≤ x ≤ n` | `4` | `x` |
| Runs | `<input type="number">` | integer, `1 ≤ n ≤ 200000` | `10` | `n` |

**Validation rules.** Evaluated in this exact order; the first failure is the only message shown, attached to the offending field. Codes match `fixtures.json → rejects`.

1. `x` non-integer → `X_NOT_INTEGER`
2. `n` non-integer → `N_NOT_INTEGER`
3. `x < 0` → `X_NEGATIVE`
4. `n < 1` → `N_BELOW_MIN`
5. `n > 200000` → `N_ABOVE_MAX`
6. `x > n` → `X_EXCEEDS_N`
7. `c` not in {80,90,95,99} → `CONF_NOT_ALLOWED`
8. `ρ < 0` or `ρ > 0.9` → `RHO_OUT_OF_RANGE`
9. design = `mixed` and `R < 1` → `RUNS_PER_PROMPT_BELOW_MIN`
10. design = `mixed` and `R > n` → `RUNS_PER_PROMPT_EXCEEDS_N`

**Outputs**

- Point estimate p̂ = x/n, formatted to 1 dp
- Wilson lower and upper bounds, formatted to 1 dp
- Interval width in percentage points, 1 dp
- Design effect D and effective sample size (shown only when D > 1)
- Interval bar (§6.4)
- Interpretation block: headline + one width class + zero or more boundary overlays + one design note + one ρ note + the permanent caveat (§5)
- Share link and "Copy result card" button (§11)

**States.** `empty` is unreachable — the page loads with defaults populated, so a result is always on screen. The full state list: `valid` (result rendered), `invalid` (result region retains the last valid result, dimmed to 40% opacity with `aria-busy="true"`, and the error message is shown on the field), `url-degraded` (one or more URL params were unusable, defaults substituted, `URL_PARAMS_IGNORED` notice shown above the inputs, dismissible).

### 4.3 Mode B — given target precision and confidence, return required runs

**Inputs**

| Input | Control | Validation | Default | URL key |
|---|---|---|---|---|
| Planning estimate | `<input type="number">`, step 0.1, suffix `%` | `0 ≤ p ≤ 100` | `42` | `p` |
| Target precision | `<input type="number">`, step 0.5, prefix `±`, suffix `points` | `0.5 ≤ w ≤ 50` | `5` | `w` |

**Validation rules,** in order:

1. `p < 0` or `p > 100` → `PLANNING_OUT_OF_RANGE`
2. `w < 0.5` → `TARGET_BELOW_MIN`
3. `w > 50` → `TARGET_ABOVE_MAX`
4. `c` not in {80,90,95,99} → `CONF_NOT_ALLOWED`
5. `ρ`, `R` as in Mode A

**Outputs**

- Required runs, integer
- Achieved half-width at that n, and at n−1, both 1 dp (proves minimality on screen)
- When D > 1: base independent-observation requirement, D, and the inflated total
- A four-row sensitivity table of required runs at ±half, ±current, ±double, ±quadruple the target (targets clamped to [0.5, 50]; duplicate rows after clamping are dropped)
- Interpretation block: headline + one budget class + zero or more boundary overlays + design note + ρ note + permanent caveat

**States:** `valid`, `invalid`, `url-degraded`, as Mode A. No loading state exists anywhere in the product — every computation is synchronous and completes in under a millisecond.

---

## 5. Interpretation layer

This section is **normative**. The strings below are the product. `src/lib/copy.ts` must contain them character for character; a test asserts that every key in the copy module is reachable and that no string contains an unreplaced `{`.

### 5.1 Formatting tokens

Every token is computed by a pure function in `src/lib/format.ts`. Rounding is **round-half-up on the scaled integer**, specified exactly as `roundHalfUp(y) = Math.floor(y + 0.5)` — not `Math.round`, and not `toFixed` alone, so that behaviour is identical across engines.

| Token | Definition | Format |
|---|---|---|
| `{x}` | mentions | integer, thousands-separated |
| `{n}` | runs (total observations) | integer, thousands-separated |
| `{pointPct}` | x/n | `roundHalfUp(v*1000)/10` then `toFixed(1)` + `%` |
| `{lowPct}` | Wilson lower bound | as `{pointPct}` |
| `{highPct}` | Wilson upper bound | as `{pointPct}` |
| `{widthPts}` | (hi − lo) × 100 | `roundHalfUp(v*10)/10` then `toFixed(1)` |
| `{confPct}` | confidence level | integer + `%` |
| `{rhoPct}` | ρ | `toFixed(2)`, trailing zero kept |
| `{effectiveN}` | n / D | `roundHalfUp(v*10)/10` then `toFixed(1)` |
| `{promptsK}` | n / R | as `{effectiveN}` |
| `{runsPerPromptR}` | R | integer |
| `{planningPct}` | planning estimate | `toFixed(1)` + `%` |
| `{targetPts}` | target half-width in points | `toFixed(1)` |
| `{requiredRuns}` | Mode B result | integer, thousands-separated |
| `{baseRuns}` | Mode B result before ρ inflation | integer, thousands-separated |
| `{targetPtsRelaxed}` | `min(50, targetPts × 2)` | `toFixed(1)` |
| `{requiredRunsRelaxed}` | required runs at `{targetPtsRelaxed}` | integer, thousands-separated |
| `{loBand}` | `max(0, planningPct − targetPts)` | `toFixed(1)` + `%` |
| `{hiBand}` | `min(100, planningPct + targetPts)` | `toFixed(1)` + `%` |

### 5.2 Composition order

Render in this order, each as its own paragraph:

1. headline (`A_HEADLINE` or `B_HEADLINE`) — always
2. exactly one width class (Mode A) or budget class (Mode B)
3. boundary overlays, in the order listed in §5.4 / §5.6, zero or more
4. exactly one design note
5. exactly one ρ note
6. `GLOBAL_LOWER_BOUND` — always, never dismissible, never collapsed

### 5.3 Mode A headline

**`A_HEADLINE`**
> {x} mentions in {n} runs is {pointPct} — but the true rate could be anywhere from {lowPct} to {highPct}.

### 5.4 Mode A width classes

Selected on interval width `W = (hi − lo) × 100`, using the unrounded value. Boundaries are a product judgement, not a statistical fact; the rationale is that 15 points is roughly the smallest difference an agency would present as meaningful, and 8 points is roughly the smallest quarter-over-quarter move worth reporting. **Labelled assumption.**

**`WIDTH_UNUSABLE`** — `W ≥ 30`
> That's a {widthPts}-point range. At this sample size the number cannot support a decision: it cannot tell you whether you are at {lowPct} or at {highPct}, and those two answers would call for different strategies. Treat this as "we have some presence" and nothing more precise.

**`WIDTH_DIRECTIONAL`** — `15 ≤ W < 30`
> That's a {widthPts}-point range — enough to tell a large gap from a small one, not enough to track change over time. A move of fewer than {widthPts} points between two measurements this size is indistinguishable from noise.

**`WIDTH_TRACKABLE`** — `8 ≤ W < 15`
> That's a {widthPts}-point range. You can act on this: it separates a strong position from a weak one, and a change larger than about {widthPts} points between two measurements this size is unlikely to be noise alone.

**`WIDTH_TIGHT`** — `W < 8`
> That's a {widthPts}-point range — tight enough to track quarter over quarter. At this sample size the limiting factor is no longer arithmetic; it is whether your prompt set represents the questions real buyers ask.

### 5.5 Mode A boundary overlays

**`ZERO_MENTIONS`** — `x = 0`
> Zero mentions in {n} runs does not mean zero visibility. It means the true rate is probably below {highPct} — you have ruled out a large presence, not established absence. To be confident the true rate is under 5% you would need 73 runs, and under 1%, 381 runs, both at 95% confidence.

**`ALL_MENTIONS`** — `x = n`
> {n} for {n} does not mean 100%. It means the true rate is probably above {lowPct}, and the interval has no room above it to show you how much headroom you have. A clean sweep is the least informative kind of high score: it tells you the rate is high without telling you how high.

**`SINGLE_RUN`** — `n = 1`
> One run is one coin flip. The interval spans {lowPct} to {highPct}, which is almost the entire scale — that is the tool telling you a single run carries essentially no information about a rate. Two runs are not much better. The published guidance for this kind of measurement is 60 to 100 runs of the same prompt.

**`TINY_N`** — `2 ≤ n ≤ 5`
> At {n} runs the interval spans {widthPts} points, which is wider than most of the differences anyone would want to detect. A measurement this small is a smoke test, not a measurement.

### 5.6 Mode B headline and budget classes

**`B_HEADLINE`**
> To measure a rate near {planningPct} to within ±{targetPts} points at {confPct} confidence, you need {requiredRuns} runs.

**`BUDGET_EASY`** — `requiredRuns ≤ 100`
> {requiredRuns} runs is a normal working budget — reachable in an afternoon with a script. Bear in mind that it buys you ±{targetPts} points on this one measurement only; every additional prompt or engine you want to report on costs another {requiredRuns} runs.

**`BUDGET_REAL`** — `100 < requiredRuns ≤ 500`
> {requiredRuns} runs is a real but manageable cost — an overnight scripted job, or a line item you can put in front of a client. Multiply it by the number of prompts and engines you plan to report on before you quote a price.

**`BUDGET_HEAVY`** — `500 < requiredRuns ≤ 2000`
> {requiredRuns} runs per prompt is a significant commitment. Before you spend it, check whether you need this precision: a ±{targetPts}-point target is only worth paying for if you would act differently at {loBand} than at {hiBand}. Loosening the target to ±{targetPtsRelaxed} points would cut the requirement to {requiredRunsRelaxed} runs.

**`BUDGET_UNREALISTIC`** — `requiredRuns > 2000`
> {requiredRuns} runs is not a realistic budget for a marketing measurement, and that is the useful finding. Precision of ±{targetPts} points at {confPct} confidence is not affordable at this scale — so if a vendor dashboard shows you a number that precise, ask how many runs are behind it. Loosening the target to ±{targetPtsRelaxed} points would bring it down to {requiredRunsRelaxed} runs.

**`TARGET_AT_FLOOR`** — `w = 0.5`
> ±0.5 points is the tightest target this tool accepts. Below that, sampling noise stops being the thing limiting you — model drift between your first run and your last will move the true rate by more than half a point.

**`PLANNING_EXTREME`** — `p ≤ 5` or `p ≥ 95`
> A planning estimate of {planningPct} sits near the edge of the scale, where the required sample size drops sharply. That makes the answer sensitive to your guess: if the true rate is closer to the middle of the range, you will need more runs than {requiredRuns}. When you are unsure, plan with 50% — it is the most demanding case, so it cannot under-size your budget.

### 5.7 Design notes

**`DESIGN_SINGLE`**
> You measured one prompt {n} times. This interval describes that one prompt's behaviour. It does not describe "your visibility in ChatGPT" — for that you would need a set of prompts sampled the way your buyers actually ask, and the variation between prompts is typically larger than the variation between runs of a single prompt.

**`DESIGN_DISTINCT`**
> You ran {n} different prompts once each. This is the cleanest design this tool supports: each prompt contributes one independent observation, so the interval needs no correlation adjustment. It generalises to the population your prompts were drawn from — and if you picked them by hand, that population is "prompts you would think of", not "prompts your buyers use".

**`DESIGN_MIXED`**
> You ran about {promptsK} prompts {runsPerPromptR} times each. That is {n} observations, but not {n} independent ones: repeat runs of the same prompt tell you less than runs of different prompts. At a correlation of {rhoPct}, your {n} observations carry about as much information as {effectiveN} independent ones.

### 5.8 Correlation notes

**`RHO_ZERO`** — `ρ = 0`
> Correlation is set to 0, which assumes every run is fully independent. That is the most optimistic assumption available, and it is almost certainly wrong for repeat runs of the same prompt. Read this interval as the narrowest it could possibly be.

**`RHO_APPLIED`** — `ρ > 0`
> Correlation is set to {rhoPct}, which widens the interval to reflect that repeat runs of one prompt duplicate information. This figure is an input, not a measurement — no published study we could find reports an intracluster correlation for repeated LLM prompt runs, so try several values and see whether your conclusion survives all of them.

### 5.9 Mode B design-effect note

**`B_DESIGN_INFLATED`** — shown when `D > 1`
> Because you are running {runsPerPromptR} repeats of each prompt at a correlation of {rhoPct}, the raw requirement of {baseRuns} independent observations becomes {requiredRuns} actual runs.

### 5.10 The permanent caveat

**`GLOBAL_LOWER_BOUND`** — always rendered, in every state, in both modes
> This interval is a lower bound on your total uncertainty. It accounts for the randomness of sampling and nothing else. It does not account for how you chose your prompts, model updates between your first run and your last, personalisation, geography, or the provider changing something on a Tuesday. The real range is wider than what you see here.

### 5.11 Validation messages

| Code | String |
|---|---|
| `X_NOT_INTEGER` | Mentions must be a whole number — you either appeared in a run or you did not. |
| `N_NOT_INTEGER` | Runs must be a whole number. |
| `X_NEGATIVE` | Mentions cannot be negative. |
| `N_BELOW_MIN` | Enter at least 1 run. |
| `N_ABOVE_MAX` | This tool caps runs at 200,000. Above that, sampling error is no longer your main problem. |
| `X_EXCEEDS_N` | Mentions cannot be more than runs. Lower the mentions, or raise the runs. |
| `CONF_NOT_ALLOWED` | Choose one of the four confidence levels: 80%, 90%, 95%, or 99%. |
| `RHO_OUT_OF_RANGE` | Correlation must be between 0 and 0.9. |
| `RUNS_PER_PROMPT_BELOW_MIN` | Runs per prompt must be at least 1. |
| `RUNS_PER_PROMPT_EXCEEDS_N` | Runs per prompt cannot be more than your total runs. |
| `PLANNING_OUT_OF_RANGE` | The planning estimate must be between 0% and 100%. |
| `TARGET_BELOW_MIN` | The tightest target this tool accepts is ±0.5 points. |
| `TARGET_ABOVE_MAX` | The loosest target this tool accepts is ±50 points, which is the whole scale. |
| `URL_PARAMS_IGNORED` | Part of that link did not make sense, so we have filled in the defaults. Your numbers may not match what the sender saw. |

---

## 6. Interface spec

### 6.1 Layout

Single column, max width `44rem`, centred, on every viewport. No sidebar, no two-column desktop variant — the agency persona uses this on a phone while presenting, and one layout means one thing to test.

Vertical order on `/`:

1. Wordmark and one-line description (`h1` is the description, not the wordmark, for search legibility)
2. Mode segmented control — two buttons, `role="tablist"`, full width
3. Input group — 2 fields side by side at `≥ 640px`, stacked below
4. Confidence select and sampling-design radio group
5. Advanced disclosure (`<details>`) containing ρ and R
6. **Result region** — `aria-live="polite"`, `role="region"`, `aria-label="Result"`
7. Share row — copy-link button, copy-result-card button
8. Method summary with a link to `/method`
9. FAQ block — five `h2` questions with `<p>` answers (§11.3)
10. Footer — licence, source-code link, "no data leaves your browser"

### 6.2 Input affordances

- `type="number"`, `inputMode="numeric"`, `step` as specified in §4. Mobile shows a numeric keypad.
- Every input has a persistent visible `<label>`. No input uses a greyed-out hint inside the field in place of a label.
- Recompute happens on every keystroke that yields a valid state. No submit button. No debounce on computation (it is sub-millisecond); a 300 ms debounce applies only to the URL write, so typing does not flood browser history.
- The URL is updated with `history.replaceState`, never `pushState` — the back button must leave the page, not step through keystrokes.
- Invalid state does not clear the result. It dims the previous result and shows the field error. Rationale: on a client call, a blank screen mid-typing looks like a crash.

### 6.3 Result display

Reading order, largest to smallest:

1. **The interval, as the largest text on the page**: `16.8% – 68.7%`
2. Directly beneath, smaller: `point estimate 40.0% · width 51.9 points · 95% confidence`
3. The interval bar
4. The interpretation block (§5.2)

The point estimate is deliberately demoted to a secondary line. The whole thesis is that the point estimate is the least trustworthy number on the screen, and typography is the fastest way to say so.

### 6.4 The interval bar — and why a bar beats a number

A fixed 0–100% horizontal track, height `2.5rem`, with the Wilson interval drawn as a filled band and the point estimate as a 2px vertical tick inside it. Axis ticks at 0, 25, 50, 75, 100 with labels.

Three reasons a bar beats a number here:

1. **A number invites requoting; a band does not.** "42%" survives being copied into a slide. "16.8%–68.7%" on a fixed scale does not compress into a single figure, so the width travels with the estimate.
2. **The fixed axis makes width self-evident without arithmetic.** On a 0–100 track, a band covering half the width is visibly half the width. The reader does not have to subtract two numbers to understand that they know almost nothing.
3. **Two results become comparable at a glance.** A user checking last month against this month sees two bands on the same scale and sees the overlap. Overlap is the concept the product exists to convey, and it is a spatial concept.

The bar is decorative for assistive technology (`aria-hidden="true"`); the authoritative content is the text above it plus the hidden description list in §9.1.

### 6.5 Mobile behaviour

- Below `640px`: inputs stack, the interval text drops from `2.25rem` to `1.75rem`, axis labels reduce to 0 / 50 / 100.
- The result region must be visible without scrolling on a 390×664 CSS-pixel viewport (iPhone 14 logical size minus browser chrome) at default zoom, with the interpretation block requiring scroll. Enforced by a Playwright assertion on the bounding box of the interval text.
- Touch targets are at least 44×44 CSS pixels.
- No hover-only affordance anywhere.

### 6.6 Visual system

Tailwind defaults only, no custom theme file. Neutral `zinc` scale; one accent, `blue-600`, used for the interval band and focus rings and nothing else. The band's fill is `blue-600` at 20% opacity with a full-opacity 2px border, so it reads correctly in greyscale and for the ~8% of male users with red-green colour vision deficiency. Dark mode via `prefers-color-scheme` using Tailwind's `dark:` variants — no toggle, no stored preference (no storage, per ADR-1).

---

## 7. Architecture Decision Records

### ADR-1 — Static-only. No backend, no database, no accounts, no network calls after page load.

**Decision.** The deployed artefact is HTML, CSS, and JS on a CDN. The application makes zero outbound requests at runtime other than the analytics beacon in ADR-6.

**Alternatives considered.** (a) Next.js route handler doing the computation server-side — rejected: introduces a runtime that can be rate-limited, metered, or billed. (b) Serverless function for the result-card image — rejected: same, plus cold starts on the one interaction that needs to feel instant. (c) A saved-calculations feature on a hosted database free tier — rejected: every free database tier is a trial that eventually expires or a project that gets paused for inactivity.

**Rationale.** Three payoffs, all load-bearing. Cost is structurally zero rather than currently zero — there is no meter to run. There are no rate limits, so a front-page traffic spike from the skeptic persona costs nothing and degrades nothing. And "your client's figures never leave your browser" becomes a verifiable claim rather than a policy promise: a reader can open the network tab and confirm it. For the agency persona typing a client's unpublished numbers, that is the difference between using the tool and not.

**Reversal trip-wire.** Reverse only if a feature that users demonstrably want cannot be built client-side. The concrete trigger: a two-proportion comparison (Phase 6) or the stratified multi-engine estimate (Phase 7) turns out to need a numerical routine that cannot be implemented in under ~300 lines of dependency-free TypeScript. As specified in §12, neither does. A second trigger: if a shareable-result feature requires server-side Open Graph image generation because a major platform stops honouring static OG images — in which case add exactly one static-export-compatible edge function and nothing else.

### ADR-2 — Next.js 15 App Router with `output: 'export'`.

**Decision.** Next.js 15, App Router, `output: 'export'` in `next.config.ts`, React 19, TypeScript in `strict` mode, Tailwind CSS v4. Deployed to Vercel Hobby.

**Alternatives considered.** (a) Vite + React — smaller and faster to build, but the builder would hand-roll metadata, sitemap, and route structure, and `/method` needs real static HTML for the citation strategy in §11.3. (b) Plain HTML + a single TypeScript bundle — fewest dependencies and best possible bundle size, but the builder is faster in React and the interpretation layer has enough conditional branches that hand-written DOM manipulation would be the slowest part of the build. (c) Astro — the technically best fit for a mostly-static page with one interactive island, and rejected only because it is not in the builder's stated stack and the learning cost eats a meaningful share of a 12-hour budget.

**Rationale.** `output: 'export'` is what makes ADR-1 structurally enforced rather than merely intended: the build fails if anyone adds a server component that needs a runtime, an API route, or `next/image` optimisation. The constraint is checked by the compiler instead of by discipline.

**Reversal trip-wire.** Move to Vite or Astro if the exported JS payload for `/` exceeds the 120 KB gzipped budget in §9.2 after one honest attempt at trimming, or if a Next.js major version removes static export.

### ADR-3 — All application state lives in the query string, in plain readable keys.

**Decision.** State is `?m=a&x=21&n=50&c=95&d=single&r=0`. Short lowercase keys, integer values, no encoding, no versioning field. React state is derived from the URL on mount and mirrored to it on change via debounced `replaceState`.

**Alternatives considered.** (a) Base64 or LZ-compressed blob in the hash — shorter for complex state, but opaque, unguessable, and impossible to hand-edit or to document in a citation. (b) `localStorage` — cannot be shared, and conflicts with the privacy claim in ADR-1. (c) No persisted state at all — kills the primary distribution mechanism.

**Rationale.** Sharing a result *is* the distribution strategy (§11), so the link is a product surface, not an implementation detail. Readable params mean a skeptic can construct a URL by hand to check a claim, a blogger can link to a specific example in a post, and there is no encoding format to version or to get wrong. Six params fit comfortably in any messaging app without truncation.

**Reversal trip-wire.** Move to a compressed hash if the parameter count exceeds ten, or if any single value stops being expressible as a short integer — which the multi-engine phase (§12, Phase 7) will trigger, since it needs a per-engine array. That phase is specified to use a compact repeated-key form (`e=chatgpt:21:50`) rather than a change of mechanism, and only fails over to compression if a real URL exceeds 1,500 characters.

### ADR-4 — The stats core has zero runtime dependencies, and confidence levels are a fixed set.

**Decision.** `src/lib/stats/` is plain TypeScript with no imports outside itself. Confidence is one of four levels, and the four z values are hard-coded literals to 16 significant figures. No normal-quantile function is implemented or imported.

**Alternatives considered.** (a) Import `jstat` or `simple-statistics` for the normal quantile — a dependency, a supply-chain surface, and a bundle cost, for one number that only ever takes four values. (b) Implement the Wichura AS241 inverse-normal algorithm — about 40 lines of magic constants that must themselves be verified, buying arbitrary confidence levels that no user in any of the three personas has asked for. (c) Free-text confidence input — expands the input surface and the test matrix for no persona benefit.

**Rationale.** The fixed set eliminates an entire class of numerical risk at zero cost to the product. It also makes the module trivially auditable, which matters because the skeptic persona reading `wilson.ts` in ten seconds and finding nothing to argue with is the single highest-leverage distribution event available. Zero dependencies is what makes the module *vendorable*: someone can copy two files into their own project without pulling in React or a stats library, which is how the math travels further than the website does.

**Reversal trip-wire.** Implement AS241 if and only if a user-facing feature requires a confidence level outside {80, 90, 95, 99} — for example a regulatory or academic user needing 99.9%. Adding one more fixed level is cheaper than a quantile function and should be preferred up to about six levels.

### ADR-5 — Shipped as one static site with a separately-tested pure core, not as a published npm package.

**Decision.** The stats core is written to be vendorable — pure, dependency-free, framework-agnostic, with its own test suite — but is not published to npm in v1. `README.md` tells readers to copy the two files, and states the MIT licence that permits it.

**Alternatives considered.** (a) Publish to npm immediately — free, but adds release tooling, versioning, changelog discipline, and a support obligation to a 12-hour build. (b) Keep it entangled with the React components — saves an hour and forfeits the audit and reuse story that ADR-4 exists to create.

**Rationale.** The benefit of vendorability is that the math is copyable and readable; a registry entry adds distribution but also maintenance. Deferring publication keeps the v1 hour budget intact while losing nothing that cannot be added later in fifteen minutes.

**Reversal trip-wire.** Publish when someone asks for it in an issue, or when a second project of the builder's own needs the module — whichever comes first.

### ADR-6 — Analytics: Vercel Web Analytics, page views only, user inputs never eventable.

**Decision.** `@vercel/analytics` (MIT, free on Hobby). Page views and referrers only. No custom events. No event may take a calculator input as a property — enforced by a lint rule banning arguments to `track()` and by the absence of any `track()` call in the codebase.

**Alternatives considered.** (a) No analytics at all — maximally pure, but then §14's success metrics are unmeasurable and the project cannot tell whether it worked. (b) Plausible or Fathom — better privacy posture, both paid, violates the cost constraint. (c) GoatCounter free tier — genuinely free and privacy-respecting, rejected because it is a single-maintainer service whose free tier is a favour rather than a product, which is exactly the dependency the cost constraint warns about. (d) Self-hosted — needs a backend, violates ADR-1.

**Rationale.** Vercel Web Analytics is cookieless, collects no personal data, and is free at any volume this project will see on the Hobby plan. The privacy claim survives because the claim is specifically about *the numbers you type*, and those are never sent anywhere — the beacon reports that a page was viewed, not what was computed. §9.4 states this distinction to the user in those terms rather than claiming a blanket "we collect nothing", because a blanket claim would be false and the skeptic persona would check.

**Reversal trip-wire.** Drop analytics entirely if Vercel moves Web Analytics behind a paid tier, if the free event cap is reached, or if the privacy distinction above ever needs more than two sentences to explain.

### ADR-7 — Result card rendered with raw Canvas 2D, not a DOM-capture library.

**Decision.** The 1200×630 PNG is drawn imperatively with `CanvasRenderingContext2D` calls in `src/lib/card.ts`, then exported with `canvas.toBlob()`.

**Alternatives considered.** (a) `html2canvas` — roughly 200 KB, blows the bundle budget on a secondary feature, and renders text unpredictably across browsers. (b) `satori` — designed for server-side use, and pulls a font pipeline. (c) A static Open Graph image with no per-result variant — free, but every shared link would look identical, which forfeits most of the sharing value.

**Rationale.** The card is a fixed layout with about nine drawing operations. A general-purpose DOM-capture engine is the wrong tool by two orders of magnitude, and its unpredictability across browsers is worst exactly where it matters — text metrics.

**Reversal trip-wire.** Reconsider if the card ever needs to reproduce the live DOM rather than a fixed layout, for instance if users request a card containing their own comparison chart.

### ADR-8 — Non-independence is surfaced and made adjustable, never silently corrected.

**Decision.** Three mechanisms together: (1) a permanent, non-dismissible statement that the interval is a *lower bound* on total uncertainty (`GLOBAL_LOWER_BOUND`); (2) an optional design-effect control (ρ) that inflates the interval, defaulting to ρ = 0 with copy stating that 0 is the optimistic bound; (3) for the clustered design, a forced ρ-sensitivity strip so the effect of the assumption is visible without opting in.

**Alternatives considered.** (a) Ignore it and mention independence in a footnote — the standard approach, and the one that gets the product destroyed in public by the skeptic persona, correctly. (b) Make ρ a required input — statistically the most honest, but nobody has a defensible value, so users would either abandon the tool or invent a number and then trust the output more because they had to enter something. (c) Ship a default ρ > 0 baked in — implies a measurement that does not exist, and every reported interval would encode an unpublished guess of ours. (d) Refuse to compute intervals for clustered designs — loses the majority use case, since K prompts × R runs is exactly what vendor dashboards do.

**Rationale.** The failure mode of the entire category is presenting a number with hidden assumptions. A tool built to criticise that cannot replicate it. Defaulting ρ = 0 with explicit copy that this is the narrowest possible reading gives the honest floor and puts the burden of the assumption where the evidence is — with the user's own knowledge of their collection method. The forced sensitivity strip on the clustered design is the compromise that keeps the default usable while making the assumption impossible to overlook.

**Reversal trip-wire.** Change the default to a measured value the moment a credible study publishes an intracluster correlation for repeated LLM prompt runs. Until then, ρ presets are flagged as assumptions in `STATS_SPEC.md` §7 and marked for human review.

### ADR-9 — Fixtures are one JSON file, and it is the single source of truth.

**Decision.** `fixtures/fixtures.json` holds every expected value. The TypeScript test suite imports it, `scripts/verify_fixtures.py` and `scripts/verify_fixtures.R` validate it against SciPy and base R independently, and the table in `TEST_FIXTURES.md` is generated from it.

**Alternatives considered.** (a) Expected values written inline in test files — fastest to write, and guarantees the documentation and the tests drift apart. (b) Values only in Markdown — human-readable, not machine-checkable, fails the acceptance-testability bar.

**Rationale.** The credibility claim is that any statistician can reproduce every number in ten minutes. That requires one artefact that both the implementation and an independent tool consume. Drift between the doc and the tests is not a risk that can be managed by care; it has to be made impossible.

**Reversal trip-wire.** None foreseen. If the file exceeds a few hundred cases, split by mode into `fixtures/mode-a.json` and `fixtures/mode-b.json` and keep the same discipline.

---

## 8. System design

### 8.1 Module boundaries

```
src/
  lib/
    stats/                    <-- pure, zero-dependency, framework-agnostic, vendorable
      z.ts                    z constants + ConfidenceLevel type
      wilson.ts               wilsonInterval, wilsonHalfWidth
      designEffect.ts         designEffect, effectiveSampleSize
      sampleSize.ts           requiredRuns (binary search)
      validate.ts             validateModeA, validateModeB -> ErrorCode | null
      index.ts                public surface: re-exports only
    format.ts                 roundHalfUp, formatPct, formatPts, formatInt
    copy.ts                   every string from PRD section 5, verbatim
    interpret.ts              (result, inputs) -> ordered string[]     [imports stats types only]
    urlState.ts               parse(URLSearchParams) -> State ; serialise(State) -> string
    card.ts                   drawResultCard(state, result) -> Promise<Blob>
    brand.ts                  NAME, TITLE, DESCRIPTION, CANONICAL_BASE
  components/
    ModeTabs.tsx  NumberField.tsx  ConfidenceSelect.tsx  DesignRadio.tsx
    AdvancedDisclosure.tsx  IntervalBar.tsx  ResultPanel.tsx
    InterpretationBlock.tsx  ShareRow.tsx  SensitivityTable.tsx  Faq.tsx
  app/
    layout.tsx  page.tsx  method/page.tsx  not-found.tsx
    opengraph-image.tsx       static, build-time only
```

**The boundary rule, enforced by an ESLint `no-restricted-imports` rule that CI treats as an error:** nothing under `src/lib/stats/` may import from anywhere outside `src/lib/stats/`. Not React, not `format.ts`, not `copy.ts`. It returns numbers and error codes; it never returns a formatted string or a piece of user-facing prose. This is what makes the directory copyable into an unrelated project, and it is what lets `STATS_SPEC.md` describe a self-contained artefact.

`interpret.ts` is the only module that knows about both numbers and prose. It is pure and separately tested: given a state and a result it returns an ordered array of string keys plus their resolved token values, so a test can assert the composition order in §5.2 without rendering React.

### 8.2 State model

```ts
type Mode = 'a' | 'b';
type ConfidenceLevel = 80 | 90 | 95 | 99;
type Design = 'single' | 'distinct' | 'mixed';

interface AppState {
  mode: Mode;
  a: { mentions: number; runs: number };
  b: { planningPct: number; targetHalfWidthPts: number };
  confidence: ConfidenceLevel;
  design: Design;
  rho: number;              // 0 .. 0.9
  runsPerPrompt: number;    // used only when design === 'mixed'
}
```

One `useReducer` in `page.tsx` holds `AppState`. Both modes' inputs persist across a mode switch, so toggling back and forth is lossless. There is no derived state in the store: results are recomputed on every render by calling the stats core, because the computation costs less than the bookkeeping needed to memoise it.

### 8.3 Data flow

```
URL on mount ──> urlState.parse ──> AppState (+ degraded flag)
                                       │
                    ┌──────────────────┴──────────────────┐
                    v                                     v
        stats/validate.ts                     debounced 300ms
                    │                                     │
          ErrorCode │ null                       urlState.serialise
                    v                                     │
        stats/{wilson,sampleSize,designEffect}    history.replaceState
                    │
                    v
              interpret.ts ──> ordered keys + tokens
                    │
                    v
        ResultPanel + IntervalBar + InterpretationBlock
```

Single direction throughout. The URL is an output of state, never read again after mount except by `popstate`, which is not subscribed to (by ADR-3 we only ever `replaceState`).

### 8.4 URL schema

Base: `https://runs-needed.vercel.app/`

| Key | Meaning | Type | Valid range | Default if absent or invalid |
|---|---|---|---|---|
| `m` | mode | string | `a` \| `b` | `a` |
| `x` | mentions | integer | `0 … n` | `4` |
| `n` | runs | integer | `1 … 200000` | `10` |
| `p` | planning estimate, percent | number, ≤1 dp | `0 … 100` | `42` |
| `w` | target half-width, points | number, ≤1 dp | `0.5 … 50` | `5` |
| `c` | confidence, percent | integer | `80` \| `90` \| `95` \| `99` | `95` |
| `d` | sampling design | string | `single` \| `distinct` \| `mixed` | `single` |
| `r` | ρ × 100 | integer | `0 … 90` | `0` |
| `k` | average runs per prompt | integer | `1 … n` | `10` |

**Parsing rules.** Each key is parsed independently. Any key that is absent, unparseable, or out of range falls back to its default, and the `url-degraded` flag is set so `URL_PARAMS_IGNORED` is shown. Unknown keys are ignored silently without setting the flag, so campaign parameters such as `utm_source` do not trigger a warning. `x > n` after parsing sets `x` to its default and sets the flag. Keys irrelevant to the active mode are still parsed and retained, so switching modes preserves them.

**Serialising rules.** Emit keys in the fixed order `m, x, n, p, w, c, d, r, k`. Omit a key when its value equals its default, so the canonical shareable link for the landing state is exactly `/` with no query string. Omit `k` unless `d=mixed`. Never percent-encode — every value is `[a-z0-9.]`.

Worked examples, each of which must round-trip through `parse ∘ serialise` unchanged:

- `/?x=21&n=50` — 21 of 50, 95%, single-prompt design, ρ=0
- `/?x=126&n=300&d=mixed&r=20&k=30` — 300 runs across ~10 prompts, ρ=0.20
- `/?m=b&p=42&w=2&c=99` — Mode B, planning 42%, ±2 points, 99% confidence

---

## 9. Non-functional requirements

### 9.1 Accessibility — target WCAG 2.2 level AA

Automated conformance is verified with `@axe-core/playwright` on `/` and `/method`, in both light and dark colour schemes, in the default state and in an invalid state. Zero violations of `serious` or `critical` impact gates the deploy.

**How the interval is conveyed to a screen reader.** The bar carries `aria-hidden="true"`. The authoritative content is (a) the visible interval text, which is real text and not an image, and (b) a visually-hidden `<dl>` immediately after the bar, inside the `aria-live="polite"` region:

```html
<dl class="sr-only">
  <dt>Lower bound</dt><dd>16.8 percent</dd>
  <dt>Upper bound</dt><dd>68.7 percent</dd>
  <dt>Point estimate</dt><dd>40.0 percent</dd>
  <dt>Interval width</dt><dd>51.9 percentage points</dd>
  <dt>Confidence level</dt><dd>95 percent</dd>
  <dt>Sampling design</dt><dd>One prompt run 10 times</dd>
</dl>
```

"percent" and "percentage points" are spelled out rather than symbolised, because screen readers announce `%` inconsistently and the distinction between a percentage and a percentage point is the exact thing this product exists to teach. The interpretation paragraphs are ordinary prose in the live region, so a screen-reader user receives the same sentence a sighted user reads — the interpretation is the product, and it must not be a visual affordance.

Additional requirements: full keyboard operability with a visible `focus-visible` ring at 3:1 contrast against both adjacent surfaces; the mode control implemented as a real `tablist`/`tab`/`tabpanel` with arrow-key navigation; every error message associated to its field via `aria-describedby` and `aria-invalid`; text contrast at least 4.5:1 and the interval band's border at least 3:1 against the track; no information conveyed by colour alone; the page usable at 400% zoom at 1280px width without horizontal scrolling; `prefers-reduced-motion` respected (the only transition in the product is the bar's width, which is disabled under that query).

### 9.2 Performance budget

| Metric | Budget | How it is checked |
|---|---|---|
| JS transferred on `/`, gzipped | ≤ 120 KB | `scripts/check-bundle.mjs` sums `.next/` client chunks referenced by `/` and fails the build above budget |
| CSS transferred, gzipped | ≤ 15 KB | same script |
| Largest Contentful Paint, simulated Slow 4G, mid-tier mobile CPU throttle 4× | ≤ 1.5 s | Playwright trace assertion |
| Cumulative Layout Shift after hydration | ≤ 0.02 | Playwright, via `PerformanceObserver` |
| Interaction to next paint on a keystroke | ≤ 50 ms | Playwright, measured over 20 synthetic keystrokes |
| Stats core execution, Mode A | < 0.1 ms | Vitest benchmark, informational, does not gate |
| Stats core execution, Mode B worst case (`p=50, w=0.5, c=99` → 66,343) | < 5 ms | Vitest, gates: binary search must be ≤ 64 iterations |

### 9.3 Browser support

Last two stable versions of Chrome, Edge, Firefox, and Safari on desktop; iOS Safari 16.4 and later; Chrome on Android, last two versions. The features that set this floor are `canvas.toBlob`, `URLSearchParams`, `structuredClone`-free code, and CSS `:has()` — all available in Safari 16.4. No polyfills, no transpilation below ES2022. Playwright runs Chromium, Firefox, and WebKit in CI, which covers the three engines.

### 9.4 Privacy posture

Stated to the user in the footer and on `/method`, in these terms: *"The numbers you type are never sent anywhere. They stay in your browser and in the link in your address bar — nothing else. We do count page views (Vercel Web Analytics, no cookies, no personal data), but the count records that a page was opened, not what was in it."*

Implementation obligations: no cookies; no `localStorage` or `sessionStorage`; no third-party scripts other than the Vercel Analytics beacon; a `Content-Security-Policy` meta tag permitting only `'self'` and `https://va.vercel-scripts.com`; `Referrer-Policy: strict-origin-when-cross-origin`; no form ever `POST`s anywhere. The claim is testable and is tested: a Playwright assertion records every outbound request during a full interaction session and fails if any request body or query string contains the entered figures.

### 9.5 Licensing

- Code, including the stats core: **MIT**, in `LICENSE`.
- Prose — the interpretation copy and `/method` — **CC BY 4.0**, stated in the footer. Attribution is therefore a licence condition when the sentences are quoted, which is the point: the copy is the asset most likely to be lifted, and CC BY converts each lift into a link.
- Third-party runtime dependencies: Next.js and React (MIT), `@vercel/analytics` (MIT). Nothing else at runtime. Dev dependencies are all MIT or Apache-2.0 and are listed with their licences in `docs/DEPENDENCIES.md`, generated by `npx license-checker --summary`.

---

## 10. Testing strategy — what gates a deploy

`npm run verify` runs all of the following in order and must exit 0. CI runs it on every push and every pull request; Vercel is configured to deploy only from `main`, and `main` is protected by the CI check.

| Gate | Tool | Failure condition |
|---|---|---|
| 1. Types | `tsc --noEmit` | any error; `strict` and `noUncheckedIndexedAccess` on |
| 2. Lint | ESLint | any error, including the `src/lib/stats/` import-boundary rule and the ban on `track()` arguments |
| 3. Fixture conformance | Vitest, reading `fixtures/fixtures.json` | any Mode A bound differing from the fixture by more than `1e-12`; any Mode B `requiredRuns` differing at all; any reject case not producing its exact `errorCode` |
| 4. Minimality property | Vitest, 500 pseudo-random cases from a fixed seed | `requiredRuns` where `halfWidth(n) > target` or `halfWidth(n−1) ≤ target` |
| 5. Monotonicity property | Vitest, fixed seed | Wilson half-width not strictly decreasing in n for n in 1…5000 at any tested (p, confidence) |
| 6. Containment property | Vitest, fixed seed, 1,000 cases | any interval where `0 ≤ lo ≤ p̂ ≤ hi ≤ 1` fails, or where `x=0` does not give `lo === 0`, or `x=n` does not give `hi === 1` |
| 7. Copy integrity | Vitest | any string in `copy.ts` that does not match `PRD.md` §5 after whitespace normalisation; any rendered output containing `{`; any copy key unreachable from `interpret.ts` |
| 8. Composition order | Vitest | `interpret.ts` returning keys out of the §5.2 order, or more than one width/budget class, or a missing `GLOBAL_LOWER_BOUND` |
| 9. URL round-trip | Vitest, fixed seed, 1,000 states | `parse(serialise(s)) !== s` for any state; or a known-bad URL not setting the degraded flag |
| 10. Build | `next build` | any error; also fails if the build emits any server-side output |
| 11. Bundle budget | `scripts/check-bundle.mjs` | over the §9.2 budgets |
| 12. End-to-end | Playwright, Chromium + Firefox + WebKit | any assertion in §6.5, §9.2, §9.4 failing |
| 13. Accessibility | `@axe-core/playwright` | any `serious` or `critical` violation on `/` or `/method`, light or dark, valid or invalid state |
| 14. Independent statistical verification | `scripts/verify_fixtures.py` | any mismatch against SciPy, against the numerically-solved defining equation, or against statsmodels |

Gate 14 runs in a separate CI job with Python and SciPy installed. It is the gate that makes the credibility claim real: it re-derives every fixture from primary tooling rather than from this repository's own code. It currently runs 457 assertions.

`scripts/verify_fixtures.R` is a redundant third check using base R's `binom.test` and `qnorm`. It is not wired into CI — it exists so a reviewer with R and no Python can reproduce the fixtures in one command.

---

## 11. Distribution surface

### 11.1 Share-link schema

The share button copies `CANONICAL_BASE + serialise(state)` — the canonical minimal form from §8.4. Because defaults are omitted, links stay short: `runs-needed.vercel.app/?x=21&n=50` is 38 characters and survives every messaging app and every character limit without shortening. There is no link shortener, no redirect service, and no server-side link record, so a shared link cannot rot and cannot be tracked.

### 11.2 Result-card image export

A 1200×630 PNG, drawn per ADR-7, downloaded as `runs-needed-{mode}-{primary}.png` where `{primary}` is `{x}-of-{n}` in Mode A and `{requiredRuns}-runs` in Mode B.

Fixed layout, top to bottom, with a 64px margin: wordmark at 28px; the interval or the required-runs figure at 96px bold; the secondary line at 32px; the interval bar at 1072×64px; the width-class or budget-class sentence wrapped to a maximum of three lines at 28px with 40px line height; and `GLOBAL_LOWER_BOUND` truncated to its first sentence at 22px. Font stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` — no web font is loaded, so the card cannot fail to render because a font request failed. Text is measured with `ctx.measureText` and wrapped by a word-greedy algorithm; if the class sentence exceeds three lines it is truncated at a word boundary and an ellipsis is appended.

The card includes the URL of the exact result at 22px in the bottom-right corner. That is the whole mechanism: the screenshot that ends up in someone's slide deck carries the link that reproduces it.

### 11.3 Structuring the page to be cited in AI answers

The product's own thesis is that AI answers are assembled from frequently-repeated, clearly-attributed statements. The page is built to be one of those statements.

- **One extractable claim per heading.** `/method` uses `h2`s phrased as the questions people ask: "How many prompt runs do you need to measure AI visibility?", "Why is the Wilson interval better than the standard formula?", "What is the margin of error on a 42% visibility score?" Each is answered in the first sentence beneath it, in under 40 words, with the number in the sentence.
- **A canonical number table.** `/method` carries a static table of required runs for ±10, ±5, and ±2 points at 95% confidence and planning estimates of 10%, 25%, 50%, 75%, and 90% — values taken from `fixtures.json`, so a model that ingests the page ingests verified figures. A table is the format most reliably extracted and quoted.
- **JSON-LD.** Two blocks in `layout.tsx`: a `SoftwareApplication` with `applicationCategory: "BusinessApplication"`, `offers.price: "0"`, and an `isAccessibleForFree: true` flag; and a `FAQPage` whose `mainEntity` is generated from the same source array that renders the visible FAQ, so the structured data can never disagree with the page.
- **A plain-language definition block.** Each of "binomial proportion", "confidence interval", "Wilson score interval", "intracluster correlation", and "design effect" defined in one sentence at `/method#glossary`, with a stable anchor per term. Definitions are the highest-frequency extraction target.
- **CC BY 4.0 on the prose** (§9.5), so quoting is licensed and attribution is a condition.
- **`sitemap.xml` and `robots.txt`** emitted statically by Next.js metadata routes, both routes listed, nothing disallowed except nothing — there is nothing to hide.
- **No client-side-only content.** Every claim, definition, and table on `/method` is in the served HTML. A crawler that does not execute JavaScript sees the entire argument. The calculator itself is the only interactive element, and it degrades to visible default inputs with no result rather than to a blank panel.

---

## 12. Phased roadmap

Hour estimates assume a solo builder driving Claude Code, and include the time spent reading the agent's output, rejecting it, and re-prompting — which in practice is where most of the time goes. They are not optimistic. Each phase corresponds to one file in `prompts/`.

### v1

| Phase | Goal | Deliverables | Exit criteria | Hours | Blocked by |
|---|---|---|---|---|---|
| **0** | A repository that fails loudly when a constraint is violated | `package.json`, `next.config.ts` with `output: 'export'`, `tsconfig.json` strict, Tailwind v4, ESLint with the stats import-boundary rule, Vitest and Playwright configured, `npm run verify` wired end to end, `.github/workflows/ci.yml` | `npm run verify` exits 0 on an empty project; a deliberately added `import React` inside `src/lib/stats/` makes lint fail; a deliberately added API route makes `next build` fail | 0.75 | — |
| **1** | The math, standalone and correct | `src/lib/stats/{z,wilson,designEffect,sampleSize,validate,index}.ts` | Every function exported, `tsc` clean, zero imports outside the directory, no UI exists yet | 1.5 | 0 |
| **2** | Proof the math is correct | `tests/stats/*.test.ts`, `fixtures/fixtures.json` in place, `scripts/verify_fixtures.py`, `scripts/verify_fixtures.R`, `scripts/check-bundle.mjs` | Gates 3–6 and 14 from §10 all pass; `python3 scripts/verify_fixtures.py` prints PASS with 457 assertions | 1.25 | 1 |
| **3** | Mode A usable | `src/lib/format.ts`, `NumberField`, `ConfidenceSelect`, `DesignRadio`, `AdvancedDisclosure`, `IntervalBar`, `ResultPanel`, `app/page.tsx`, `app/layout.tsx`, `src/lib/brand.ts` | Typing 4 and 10 shows `16.8% – 68.7%`; every §4.2 validation rule reachable through the UI in its documented order | 1.75 | 2 |
| **4** | Mode B usable | `ModeTabs`, `SensitivityTable`, Mode B branch of `page.tsx` | `p=50, w=5, c=95` shows 381 and displays the half-width at 381 and at 380; mode switch preserves both modes' inputs | 1.0 | 3 |
| **5** | The interpretation layer — the actual product | `src/lib/copy.ts`, `src/lib/interpret.ts`, `InterpretationBlock` | Gates 7 and 8 pass; all 30 Mode A and 20 Mode B fixtures produce their fixture `resultClass`; no rendered output contains `{` | 1.25 | 4 |
| **6** | Results are shareable | `src/lib/urlState.ts`, `ShareRow` (link only), degraded-state notice | Gate 9 passes; the three §8.4 examples round-trip; `?x=999&n=10` shows `URL_PARAMS_IGNORED`; back button leaves the page after 20 keystrokes | 1.0 | 5 |
| **7** | Defensible in public | `app/method/page.tsx`, `Faq`, JSON-LD in `layout.tsx`, `sitemap.ts`, `robots.ts`, `sr-only` description list, CSP meta, focus styles, `STATS_SPEC.md` linked from `/method` | Gates 12 and 13 pass; the §9.2 budgets hold; `/method` contains every §11.3 element; the required-runs table on `/method` matches `fixtures.json` | 1.5 | 6 |
| **8** | Results are screenshot-portable | `src/lib/card.ts`, card button in `ShareRow` | Downloaded PNG is exactly 1200×630, is a valid PNG, exceeds 5 KB, and contains the result URL — asserted in Playwright by decoding the blob header and dimensions | 1.0 | 7 |
| **9** | Live | `README.md`, `LICENSE`, `docs/DEPENDENCIES.md`, Vercel project connected, `@vercel/analytics` added, branch protection on `main` | Production URL serves `/` and `/method`; `npm run verify` passes on `main`; network tab on production shows no request containing user figures | 0.75 | 8 |

**v1 total: 11.75 hours.** ══════════ **v1 CUT LINE** ══════════ Everything below ships only after v1 is live and has been read by someone hostile.

### Post-v1

| Phase | Goal | Deliverables | Exit criteria | Hours | Blocked by |
|---|---|---|---|---|---|
| **10** | Before / after comparison | `stats/twoProportion.ts` implementing Newcombe's hybrid score interval for the difference of two independent proportions; third mode `m=c`; URL keys `x1,n1,x2,n2`; interpretation copy for "the change is inside the noise" / "the change survives the noise" | Fixtures for the difference interval verified against R's `Hmisc` or `PropCIs::diffscoreci`; the two-proportion module still imports nothing; overlapping-interval copy written verbatim before any UI is built | 3.0 | v1 live |
| **11** | Multi-engine stratified estimate | `stats/stratified.ts`: per-engine Wilson plus a weighted overall estimate with variance `Σ wₖ² vₖ`, back-solved to an effective n for display; URL form `e=chatgpt:21:50` repeated per engine | Stratified variance verified against a survey-statistics reference implementation; **the weighting scheme requires a human decision** — equal weight per engine, weight by engine market share, or weight by the client's own traffic mix — and that decision must be made and documented before build, not during | 4.5 | 10 |
| **12** | Embeddable widget | A single `<script>` tag rendering an iframe of `/embed`, fixed 480×320, read-only, with the URL params of the host page's choosing; `/embed` is a static route with no share controls | Embed renders inside a third-party page with no console errors; embed adds zero KB to `/`; CSP `frame-ancestors *` set only on `/embed` | 3.0 | 11 |
| **13** | Replace the ρ assumption with a measurement | An open dataset of repeated identical prompt runs, collected by the builder or contributed; an estimated intracluster correlation with its own interval; ρ default changed from 0 to the measured value; `STATS_SPEC.md` §7 human-review flag cleared | A published ρ estimate with stated methodology and raw data in the repository; the ADR-8 trip-wire formally triggered and the ADR updated | 6.0 | 12 |

Phase 13 is the phase that turns the product from a calculator into a citable source, and it is the only phase that requires collecting data. It is last because it is worthless until the calculator that consumes the number exists.

---

## 13. Risks

Ranked by expected damage. Each has a mitigation already specified above and a kill signal — the observation that means the mitigation failed and the response has to change.

**1. A statistician publicly demonstrates that the independence assumption invalidates the intervals.**
This is the highest-damage risk because it is the most likely to be correct and the most damaging to the builder personally. *Mitigation:* ADR-8 — the interval is framed as a lower bound in permanent copy, ρ is adjustable, the clustered design forces a sensitivity strip, and `STATS_SPEC.md` §6 states the violation in the critic's own terms before they can. The strongest available position is agreeing loudly and first. *Kill signal:* a credible critic argues that the *framing* is wrong rather than incomplete — for instance that a design-effect adjustment is the wrong model for LLM run correlation and that no binomial interval is defensible at all. Response: add their argument to `/method` verbatim with attribution, and demote the interval from a headline number to one input among several.

**2. An arithmetic error ships.**
A wrong number in a tool whose only claim is correctness is fatal, and one wrong z digit would do it. *Mitigation:* §10 gates 3–6 and 14 — 457 assertions re-derived from SciPy, from statsmodels, and from the numerically-solved defining equation, plus property tests for minimality, monotonicity, and containment. *Kill signal:* any user-reported numerical discrepancy that the fixture suite did not catch. Response: reproduce it as a fixture before fixing it, and add whichever property test would have caught it.

**3. Nobody uses it.**
The most probable outcome for any free calculator. *Mitigation:* §11 in full — shareable URLs, result cards carrying their own link, `/method` structured for citation, CC BY on the prose. *Kill signal:* under 500 sessions in the first 60 days despite the launch surfaces being posted. Response: this is a distribution failure, not a product failure — do not add features. Write the argument as a standalone post with the calculator as its evidence, which is a writing problem and costs no build hours.

**4. A vendor responds by adding intervals to their dashboard.**
The best possible outcome for the industry and the worst for the product's differentiation. *Mitigation:* none needed, and none should be attempted. *Kill signal:* two or more major platforms shipping intervals. Response: declare the win in the README, pivot the tool to auditing *their* intervals — checking whether the stated n supports the stated precision — which is a smaller and more defensible niche.

**5. The width thresholds in §5.4 are challenged as arbitrary.**
They are arbitrary; they are a product judgement dressed as a finding. *Mitigation:* §5.4 labels them an assumption in the document, and `/method` states the thresholds and their reasoning in plain sight. *Kill signal:* a reviewer argues the thresholds mislead rather than simplify. Response: keep the classification, add the raw width to the headline (already there), and let the class become a subtitle rather than the verdict.

**6. Vercel changes the Hobby plan.**
*Mitigation:* the artefact is a static export, so it deploys unchanged to Cloudflare Pages, Netlify, or GitHub Pages. *Kill signal:* any Hobby-tier commercial-use restriction that a free tool arguably triggers. Response: move to Cloudflare Pages; ADR-2 is unaffected because nothing in the build depends on Vercel except the analytics beacon, which ADR-6 already specifies as droppable.

**7. Scope creep into a measurement tool.**
The most likely self-inflicted failure: "it should just run the prompts for you." That requires API keys, a backend, and money, and it converts a permanent free asset into an abandoned side project. *Mitigation:* Non-goal 1, ADR-1, and the cut line in §12. *Kill signal:* the builder starts a branch containing an API key of any kind. Response: stop, and ship it as a separate repository so the calculator's zero-cost guarantee stays intact.

---

## 14. Success metrics

What would make this worth 12 hours, and how each is measured with the instrumentation ADR-6 actually permits — page views and referrers, nothing else. Two of the five are deliberately not automatable; they are read manually, because the outcomes that matter here are qualitative and pretending otherwise would be the same dishonesty the product is built to criticise.

| # | Metric | Target | Measured by | Window |
|---|---|---|---|---|
| 1 | Sessions | ≥ 2,000 | Vercel Web Analytics page views on `/` | 90 days from launch |
| 2 | Share-link arrivals — the only proxy for "someone used this in an argument" | ≥ 15% of sessions arrive with a query string containing `x` or `p` | Vercel referrer and path data; query strings are visible in the path dimension without any custom event | 90 days |
| 3 | `/method` read rate — proxy for the skeptic persona engaging rather than bouncing | ≥ 10% of sessions view `/method` | Vercel page views, ratio of `/method` to `/` | 90 days |
| 4 | Citation by a third party — a vendor, an agency post, an AI answer, or a newsletter linking or quoting the tool | ≥ 3 instances | Manual: a monthly search for the tool name and for a distinctive sentence from the copy. **Not automatable, read by hand.** | 180 days |
| 5 | Substantive statistical challenge — an issue or post arguing about the method on its merits, whether or not it is right | ≥ 1 | Manual: GitHub issues and mentions. **Not automatable.** A single serious critique is worth more than the traffic targets, because it means the argument reached someone qualified to test it. | 180 days |

Metric 5 is the one to watch. Metrics 1 through 3 measure whether the tool was found. Metric 4 measures whether it was useful. Metric 5 measures whether it was taken seriously, which is the only outcome that changes anything about the category — and the one that most justifies the hours.
