# Contributing

## The contribution this project most wants

**Tell us the math is wrong.** If you find an error in the statistics, open an issue using the *Statistical dispute* template. That is worth more than any feature. Please include the input, the value we produce, the value you believe is correct, and the tool you used to get it — `scipy`, R, Stata, or a textbook page number all work equally well.

Two known weak points, so you do not have to look for them:

1. The intracluster correlation presets (0.05, 0.1, 0.2) are borrowed magnitudes, not measurements for this domain. `STATS_SPEC.md` §7, item 1.
2. `1 + (R − 1)ρ` may be the wrong inflation model if LLM run correlation is autocorrelated in time rather than exchangeable within a prompt. `STATS_SPEC.md` §6, final paragraph.

## Ground rules that will not be relaxed

A pull request that breaks any of these will be declined regardless of merit, because each one is load-bearing for the project's cost model or its credibility:

- **No backend, no database, no accounts, no email capture.** `PRD.md` ADR-1.
- **No paid dependency and no free tier that can expire.** Runtime dependencies are `next`, `react`, `react-dom`, `@vercel/analytics`, and nothing else.
- **No runtime dependency inside `src/lib/stats/`.** The directory must stay copyable into an unrelated project.
- **No analytics event carrying a user's figures.** `track()` takes no arguments, and a lint rule enforces it.
- **No change to a fixture or a verifier to make a test pass.** If the implementation and the fixtures disagree, the implementation is wrong.

## Changing user-facing copy

`PRD.md` §5 is the normative source for every string, and `tests/copy.test.ts` reads it at runtime. Edit `PRD.md` first, then `src/lib/copy.ts` to match. A PR that changes `copy.ts` alone will fail CI, by design.

## Setup

```bash
nvm use            # Node 22
npm ci
npm run dev

npm run verify     # everything CI runs
```

For the independent statistical checks:

```bash
pip install scipy statsmodels
python3 scripts/verify_fixtures.py
```

## What gates a merge

The 14 gates in `PRD.md` §10. In practice: `npm run verify` and `scripts/verify_fixtures.py` both exit 0, on all three browser engines, with zero serious or critical accessibility violations. CI runs all of it on every pull request.

## Scope

Anything past the v1 cut line in `PRD.md` §12 is a roadmap conversation before it is a pull request — please open an issue first. The fastest way to have a feature declined is for it to require a server.
