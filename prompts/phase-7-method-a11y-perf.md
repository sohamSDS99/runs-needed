# Phase 7 — Defensible in public

Branch: `phase-7-method-a11y-perf`. Estimated 1.5 hours. This is the phase that determines whether the skeptic persona shares the tool or takes it apart.

## Read these first

- `PRD.md` §11.3 — every element the `/method` page must contain and why each one is structured for extraction
- `PRD.md` §9 — accessibility target, performance budget, browser support, privacy posture, licensing
- `STATS_SPEC.md` §3.2, §5, §6, §7 — the content of `/method`. The independence argument and the assumption table are the substance; do not summarise them into something reassuring.
- `CLAUDE_CODE_TASKS.md` — T22, T23, T24

## Build

T22 (`/method`, FAQ, JSON-LD, sitemap, robots), T23 (accessibility hardening and the axe suite), T24 (performance, privacy, and mobile end-to-end tests).

## Do not

- **Do not soften the independence section.** `STATS_SPEC.md` §6 states the strongest objection to the tool and names what would falsify the approach. That paragraph goes on the page. Publishing the best argument against your own product first is the only defence that works, and removing it to look more confident is the single worst edit available in this build.
- **Do not omit the assumption table.** `STATS_SPEC.md` §7 items 1 and 3 are the weakest parts of the work and must be visible on `/method`, not only in the repository.
- **Do not hand-write the required-runs table.** Generate it at build time from `fixtures/fixtures.json` (T22.2 asserts a verified figure appears). A published table of numbers this product cannot reproduce would be the most damaging possible error.
- **Do not write FAQ answers longer than 40 words in the first sentence, and do not bury the number.** `PRD.md` §11.3: each `h2` is a question and the first sentence answers it with the figure in it.
- **Do not generate the `FAQPage` JSON-LD from a separate array.** Same source as the visible FAQ, so structured data cannot disagree with the page.
- **Do not add a web font.** System stack only — it costs bytes against the 120 KB budget and it is a render-blocking dependency on a third party.
- **Do not add a cookie banner.** There are no cookies. Adding a banner would imply otherwise.
- **Do not fix an axe violation by adding `aria-hidden` to the offending element.** Fix the semantics.
- **Do not raise the performance budget to make `check-bundle.mjs` pass.** If you are over, remove code. `PRD.md` ADR-2's reversal trip-wire covers the case where trimming genuinely fails.

## Definition of done

Every acceptance command in T22–T24, plus:

```bash
npm run build
npx playwright test; echo "expect 0 across chromium, firefox, webkit: $?"
node scripts/check-bundle.mjs   # print both byte counts against 122880 and 15360
node scripts/check-static.mjs; echo "expect 0: $?"

# Every glossary term is in the served HTML, not injected client-side.
for t in "binomial proportion" "confidence interval" "Wilson score interval" \
         "intracluster correlation" "design effect"; do
  grep -qi "$t" out/method/index.html && echo "ok: $t" || echo "MISSING: $t"
done

# Both JSON-LD blocks parse.
node -e "const s=require('fs').readFileSync('out/index.html','utf8');\
const m=[...s.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)];\
console.log(m.map(x=>JSON.parse(x[1])['@type']))"
# expect: [ 'SoftwareApplication', 'FAQPage' ]

test -f out/sitemap.xml && test -f out/robots.txt; echo "expect 0: $?"
```

## Report

Exit codes, both bundle numbers against budget, the axe violation counts for all four states, and the measured LCP, CLS, and INP against the §9.2 budgets. If any budget is missed, report the number rather than adjusting the budget.
