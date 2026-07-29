# Phase 6 — Shareable results

Branch: `phase-6-url-state-share`. Estimated 1 hour.

## Read these first

- `PRD.md` §8.4 — the complete URL schema, parsing rules, serialising rules, and three worked examples that must round-trip
- `PRD.md` §7 ADR-3 — why the parameters are readable rather than encoded
- `PRD.md` §11.1 — why the link is a product surface rather than an implementation detail
- `CLAUDE_CODE_TASKS.md` — T20, T21

## Build

T20 (`urlState.ts`), T21 (`ShareRow` link button, degraded notice).

## Do not

- **Do not use `pushState`.** `replaceState` only, debounced 300 ms. The back button must leave the page, not walk backwards through twenty keystrokes. T21's first acceptance criterion greps for the absence of `pushState`.
- **Do not base64, compress, or otherwise encode the state.** ADR-3. A skeptic constructing a URL by hand to check a claim is a feature.
- **Do not emit keys that equal their defaults.** The default state serialises to the empty string, so the canonical share link for the landing state is bare `/`.
- **Do not set the degraded flag for unknown keys.** `utm_source` and friends must pass through silently. Only a *known* key that is unparseable or out of range triggers the notice.
- **Do not use `localStorage` or `sessionStorage` for anything**, including remembering the last confidence level or the disclosure's open state. `CLAUDE.md` rule 3.
- **Do not subscribe to `popstate`.** Since we only ever `replaceState`, there is nothing to respond to.
- **Do not debounce the computation.** Only the URL write is debounced. The result updates on every keystroke.
- **Do not add a URL shortener, a redirect, or any server-side link record.** A shared link must be unable to rot and unable to be tracked.

## Definition of done

Every acceptance command in T20–T21, plus:

```bash
npm test; echo "expect 0: $?"
grep -rn "pushState\|localStorage\|sessionStorage" src/ ; echo "expect no output above"

npx tsx -e "import {parse,serialise} from './src/lib/urlState';\
const d=parse(new URLSearchParams('')).state;\
console.log(JSON.stringify(serialise(d)));\
console.log(serialise(parse(new URLSearchParams('x=21&n=50')).state));\
console.log(serialise(parse(new URLSearchParams('x=126&n=300&d=mixed&r=20&k=30')).state));\
console.log(serialise(parse(new URLSearchParams('m=b&p=42&w=2&c=99')).state));"
# expect: ""  then the three PRD section 8.4 examples reproduced exactly

npx playwright test tests/e2e/share.spec.ts; echo "expect 0: $?"
node scripts/check-bundle.mjs; echo "expect 0: $?"
```

## Report

Exit codes, the four serialised strings above, and confirmation that history length does not grow while typing.
