# Phase 8 — Screenshot-portable results

Branch: `phase-8-result-card`. Estimated 1 hour.

## Read these first

- `PRD.md` §11.2 — the exact card layout, dimensions, font sizes, and filename scheme
- `PRD.md` §7 ADR-7 — why this is raw Canvas rather than a DOM-capture library
- `CLAUDE_CODE_TASKS.md` — T25

## Build

T25: `src/lib/card.ts` and the card button in `ShareRow`.

The mechanism the card exists for is one line of the spec: **the card carries the URL that reproduces it.** A screenshot in someone's slide deck becomes a link back, which is the only distribution channel this product has that does not depend on someone choosing to share.

## Do not

- **Do not install `html2canvas`, `satori`, `dom-to-image`, or any capture library.** ADR-7. About 200 KB against a 120 KB budget, for a fixed layout of nine drawing operations, with unpredictable text metrics in exactly the place that matters.
- **Do not load a web font for the card.** System stack. A card that fails to render because a font request failed is worse than a card in Helvetica.
- **Do not render the card server-side or via an image API.** No backend. ADR-1.
- **Do not make the card dynamic-height.** 1200×630 exactly. Truncate the class sentence at three lines at a word boundary with an ellipsis.
- **Do not omit the result URL.** Bottom-right, 22px. Without it the feature has no purpose.
- **Do not add a share-to-social integration.** A downloaded PNG and a copyable link cover it, and every platform SDK is a third-party script.

## Definition of done

Every acceptance command in T25, plus:

```bash
npx playwright test tests/e2e/card.spec.ts; echo "expect 0: $?"
node -e "const s=require('fs').readFileSync('src/lib/card.ts','utf8');\
process.exit(/html2canvas|satori|dom-to-image|import .* from ['\"][^.]/.test(s)?1:0)"; echo "expect 0: $?"
npm run build && node scripts/check-bundle.mjs; echo "expect 0: $?"
npm run verify; echo "expect 0: $?"
```

The Playwright assertion must verify the PNG signature bytes and the IHDR width and height, not merely that a file downloaded.

## Report

Exit codes, the downloaded file size, and the decoded dimensions.
