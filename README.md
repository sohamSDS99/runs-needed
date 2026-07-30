# Runs Needed

**A free calculator that turns an AI-visibility number into a confidence interval, and tells you how many prompt runs you would need for a given precision.**

4 mentions in 10 runs is not "40% visibility." At 95% confidence it is somewhere between **16.8% and 68.7%** — a 51.9-point range. No AI visibility dashboard shows you that, because no vendor benefits from showing you that.

Live: `https://runs-needed.vercel.app`

---

## Why this exists

SparkToro and Gumshoe.ai ran 2,961 prompts across ChatGPT, Claude, and Google AI in late 2025 and [published the results in January 2026](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/). Two findings: the same prompt returns the same list of brands less than 1 time in 100, and yet *appearance frequency* across many runs is stable and trackable. Their recommendation was 60–100 runs per prompt. Their closing question was the one nobody answered:

> How many times do you need to run a prompt to have statistically sound answers about a brand's relative visibility?

This is roughly 200 lines of arithmetic that answers it.

## What's in this repository

The **built application** — a Next.js static export under `src/` — together with the complete specification it was generated from. The four documents below are the normative source; the app was built by executing `CLAUDE_CODE_TASKS.md` in order, and every machine-checkable acceptance criterion in that file passes (`npm run verify`).

| Document | What it is |
|---|---|
| [`PRD.md`](PRD.md) | Product requirements: users, functional spec, all interpretation copy verbatim, 9 architecture decision records, phased roadmap, risks |
| [`STATS_SPEC.md`](STATS_SPEC.md) | Every formula in full, with notation, a hand-computed worked example, an edge-case table, cited sources, and the independence problem confronted directly |
| [`TEST_FIXTURES.md`](TEST_FIXTURES.md) | 74 input/expected-output pairs plus 15 rejected inputs, with commands to verify them independently |
| [`CLAUDE_CODE_TASKS.md`](CLAUDE_CODE_TASKS.md) | 26 atomic build tasks, each with the exact files it touches and machine-checkable acceptance criteria |
| [`ITERATION_LOG.md`](ITERATION_LOG.md) | The refinement passes these documents went through, with the defects each hostile read caught |
| [`prompts/`](prompts/) | One session-opening brief per roadmap phase, for driving the build with an AI coding agent |

## Build and run

```bash
npm install
npm run dev        # local dev server at http://localhost:3000
npm run build      # static export to out/
npm run verify     # types, lint, unit + property tests, build, static + bundle checks, e2e (Chromium/Firefox/WebKit)
```

`npm run verify` is the full gate CI runs. The interpretation copy is generated verbatim from `PRD.md` §5 and a test fails on any drift; the numeric fixtures are cross-checked against SciPy and statsmodels by `scripts/verify_fixtures.py`.

## Verify the math yourself

Nothing here asks to be trusted. `fixtures/fixtures.json` is the single source of truth for every expected value, and three independent tools reproduce it.

```bash
pip install scipy statsmodels
python3 scripts/verify_fixtures.py      # 457 assertions -> PASS
```

Every fixture is checked three ways: the closed form recomputed from `scipy.stats.norm.ppf` with no hard-coded constants; the **defining equation** of the Wilson interval solved numerically with `brentq`, which validates the algebra rather than the arithmetic; and `statsmodels` as a third-party implementation.

```bash
Rscript scripts/verify_fixtures.R       # same fixtures, base R + jsonlite, run from the repo root
python3 scripts/coverage.py             # reproduces the Wald-vs-Wilson coverage table
python3 scripts/monotonicity.py         # 960,000 points, zero violations
```

`scripts/coverage.py` prints the number that decides the method choice: a nominally 95% **Wald** interval at n=10 has true coverage as low as **9.6%**. That is why this uses the Wilson score interval. Details in [`STATS_SPEC.md` §3.2](STATS_SPEC.md).

## Vendoring the statistics

`src/lib/stats/` is pure TypeScript with **zero runtime dependencies** and no framework coupling — it imports nothing outside its own directory, and an ESLint rule fails the build if that ever stops being true. Copy the directory into your own project; the MIT licence permits it and no attribution is required for the code. If you find an error in it, please open an issue.

## Architecture in one line

Static site, no backend, no database, no accounts, no API calls, no LLM calls. Permanently free to run, no rate limits, and the numbers you type never leave your browser — which for an agency entering a client's unpublished figures is the difference between using this and not. The reasoning, and the specific conditions that would justify reversing it, are in [`PRD.md` §7 ADR-1](PRD.md).

## Known open questions

Stated here rather than buried, because they are the honest state of the work:

1. **The intracluster correlation presets (0.05, 0.1, 0.2) are assumptions, not measurements.** No published study we could find reports an intracluster correlation for repeated LLM prompt runs. The tool defaults to ρ = 0 and says in plain copy that 0 is the most optimistic reading available. Roadmap Phase 13 exists to replace the guess with a measurement. See [`STATS_SPEC.md` §7](STATS_SPEC.md), item 1.
2. **Repeated LLM queries are not independent Bernoulli trials.** Caching, session state, batching, and model drift all correlate outcomes. Every interval this tool produces is therefore a **lower bound** on total uncertainty, and it says so permanently and non-dismissibly on screen. The full argument, including what would falsify the approach, is in [`STATS_SPEC.md` §6](STATS_SPEC.md).
3. **The interval-width thresholds (8 / 15 / 30 points) are product judgement**, not a statistical result, and are labelled as such wherever they appear.

## Licence

Code: [MIT](LICENSE). Prose, including all interpretation copy and the method page: [CC BY 4.0](LICENSE) — quote it, and attribute it.
