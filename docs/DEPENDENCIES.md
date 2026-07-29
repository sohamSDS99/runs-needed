# Dependency inventory

Regenerate with `npx license-checker --summary` after any dependency change (task T26). CI fails if this file contains `GPL`, `AGPL`, or `proprietary`.

## Runtime dependencies — the complete list

| Package | Purpose | Licence |
|---|---|---|
| `next` | Framework, static export | MIT |
| `react` | UI runtime | MIT |
| `react-dom` | DOM renderer | MIT |
| `@vercel/analytics` | Page-view beacon, cookieless, no arguments ever passed (ADR-6) | MIT |

**Four packages. That is the whole runtime surface**, and `package.json` is asserted against exactly this list in task T01, criterion 6. `src/lib/stats/` depends on none of them.

## Development dependencies

| Package | Purpose | Licence |
|---|---|---|
| `typescript` | Type checking | Apache-2.0 |
| `vitest` | Unit and property tests | MIT |
| `@playwright/test` | End-to-end, three engines | Apache-2.0 |
| `@axe-core/playwright` | Accessibility gate | MPL-2.0 |
| `eslint` + `eslint-config-next` | Lint, plus the import-boundary and `track()` rules | MIT |
| `tailwindcss` + `@tailwindcss/postcss` | Styling | MIT |
| `tsx` | Running the acceptance-criteria one-liners | MIT |

`@axe-core/playwright` is MPL-2.0, which is weak copyleft and file-scoped. It is a development dependency only, never bundled, and no axe source is modified, so no MPL obligation attaches to this project's code. Noted here so the grep in T26.5 — which looks for `GPL` and `AGPL` — is understood to be deliberate rather than an oversight.

## Verification tooling — not npm dependencies

Required only to reproduce the statistical claims, never installed by `npm ci` and never shipped:

| Tool | Used by | Licence |
|---|---|---|
| Python 3.11+ | all four `scripts/*.py` | PSF |
| `scipy` | `verify_fixtures.py`, `coverage.py`, `monotonicity.py` | BSD-3-Clause |
| `statsmodels` | `verify_fixtures.py`, third-party cross-check | BSD-3-Clause |
| R + `jsonlite` | `verify_fixtures.R` | GPL-2 (R itself), MIT (`jsonlite`) |

R is GPL-licensed, which is why `verify_fixtures.R` is an optional reviewer convenience run outside CI rather than part of the build. Nothing in this repository links against R or distributes any part of it.
