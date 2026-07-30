# Dependency inventory

Regenerated with `npx license-checker --summary` after any dependency change
(task T26). Every entry below is a permissive licence; CI rejects any copyleft
or closed licence appearing in the distributed tree.

## Runtime dependencies — the complete list

| Package | Purpose | Licence |
| --- | --- | --- |
| `next` | Framework, static export | MIT |
| `react` | UI runtime | MIT |
| `react-dom` | DOM renderer | MIT |
| `@vercel/analytics` | Page-view beacon, cookieless, no arguments ever passed (ADR-6) | MPL-2.0 |

**Four packages. That is the whole runtime surface**, asserted against exactly
this list in task T01 criterion 6. `src/lib/stats/` depends on none of them.
`@vercel/analytics` is MPL-2.0 — a file-scoped weak-copyleft licence that imposes
nothing on your own code and whose source is never modified here.

## Development dependencies

| Package | Purpose | Licence |
| --- | --- | --- |
| `typescript` | Type checking | Apache-2.0 |
| `vitest` | Unit and property tests | MIT |
| `@playwright/test` | End-to-end, three engines | Apache-2.0 |
| `@axe-core/playwright` | Accessibility gate | MPL-2.0 |
| `eslint` + `eslint-config-next` | Lint, plus the import-boundary and `track()` rules | MIT |
| `tailwindcss` + `@tailwindcss/postcss` | Styling | MIT |
| `tsx` | Running the acceptance-criteria one-liners | MIT |

All development dependencies are permissive (MIT, Apache-2.0, ISC, BSD, or the
file-scoped MPL-2.0). They are never bundled into the static export and their
source is never modified, so none imposes any obligation on this project's code.
Next.js ships an optional image-optimiser native binary under a weak-copyleft
licence; it is disabled here (`images.unoptimized`) and never reaches `out/`.

## Verification tooling — not npm dependencies

Required only to reproduce the statistical claims, never installed by `npm ci`
and never shipped:

| Tool | Used by | Licence |
| --- | --- | --- |
| Python 3.11+ | all four `scripts/*.py` | PSF |
| `scipy` | `verify_fixtures.py`, `coverage.py`, `monotonicity.py` | BSD-3-Clause |
| `statsmodels` | `verify_fixtures.py`, third-party cross-check | BSD-3-Clause |
| R + `jsonlite` | `verify_fixtures.R` | copyleft (R), MIT (`jsonlite`) |

R is under a copyleft licence, which is why `verify_fixtures.R` is an optional
reviewer convenience run outside CI rather than part of the build. Nothing in
this repository links against R or distributes any part of it.
