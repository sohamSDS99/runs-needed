# Phase 12 — Embeddable widget

**Post-v1.** Branch: `phase-12-embed`. Estimated 3 hours.

## The bet

An embed puts the interval on someone else's page — an agency's methodology page, a blog post about AI visibility measurement, a vendor's documentation if the argument lands. Each embed is a permanent link and a permanent audit of whatever number is next to it. This is the only phase whose value is entirely distributional.

## Read these first

- `PRD.md` §12, the Phase 12 row
- `PRD.md` §9.4 — the privacy posture, which the embed must not weaken
- `PRD.md` §11 — the distribution surface the embed extends

## Build

A static `/embed` route, 480×320, read-only, reading the same URL parameters as `/`. A one-line `<script>` snippet on `/method` that a host page can copy, which injects an `<iframe>` pointing at `/embed` with the parameters the host chooses. A copy-embed-code button next to the existing share controls.

## Do not

- **Do not let the embed add a single byte to `/`.** It is a separate route with its own chunk. `check-bundle.mjs` measures `/` and must still pass unchanged.
- **Do not put share, copy, or card-export controls in the embed.** Read-only. The only interactive element is a link to the full tool with the same parameters.
- **Do not make the embed script do anything except create an iframe.** No analytics on the host page, no message passing, no resize observer talking to a parent, no cookies. Anything else and no reputable site will paste it.
- **Do not set `frame-ancestors *` globally.** Only on `/embed`. The rest of the site keeps its CSP.
- **Do not accept host-page input other than the documented URL parameters**, and validate them with the same `urlState.parse` the main app uses, degraded flag included.
- **Do not render the embed without `GLOBAL_LOWER_BOUND`.** Truncated to its first sentence if space demands, but present. An embed that shows an interval without the caveat is the exact artefact this product was built to argue against.

## Definition of done

The embed renders inside a third-party page with no console errors on all three engines; `node scripts/check-bundle.mjs` still passes for `/` with the same numbers as before this phase; `frame-ancestors` is set on `/embed` only; the caveat is present in the embed's served HTML; `npm run verify` exits 0.
