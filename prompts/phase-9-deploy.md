# Phase 9 — Live

Branch: `phase-9-deploy`, merged to `main`. Estimated 45 minutes.

## Read these first

- `PRD.md` §9.4, §9.5 — the privacy claim you are about to publish, and the licensing you are about to assert
- `PRD.md` §7 ADR-6 — the analytics decision and its limits
- `CLAUDE_CODE_TASKS.md` — T26

## Build

T26. Add `@vercel/analytics` to `layout.tsx`. Generate `docs/DEPENDENCIES.md`. Verify `README.md` and `CLAUDE.md` describe what actually shipped. Connect the Vercel project, enable Web Analytics, protect `main` with the CI check.

## Do not

- **Do not call `track()` with arguments, ever.** Page views only. A lint rule enforces it and T26.6 greps for it. The privacy claim in §9.4 is specifically that the numbers a user types are never sent anywhere; one custom event with a figure in it makes the claim false and the project dishonest.
- **Do not add a second analytics provider, a session recorder, a heatmap, or a chat widget.**
- **Do not add a newsletter signup, an email capture, or a "get updates" field.** Non-goal 2.
- **Do not add a custom domain.** The Vercel subdomain is free in perpetuity; a domain is a recurring cost, and the cost constraint is zero rather than cheap.
- **Do not enable Vercel's image optimisation, edge middleware, or ISR.** Static export forbids them and `check-static.mjs` will catch it.
- **Do not overstate the privacy claim in the footer.** Use the §9.4 wording, which admits the page-view beacon. A blanket "we collect nothing" would be false, and the audience most likely to read the footer is the audience most likely to open the network tab.

## Definition of done

```bash
npm run verify; echo "expect 0: $?"
python3 scripts/verify_fixtures.py | tail -2      # expect 457 assertions, PASS
node scripts/check-no-placeholders.mjs; echo "expect 0: $?"

curl -fsS https://runs-needed.vercel.app/ | grep -q "16.8%"; echo "expect 0: $?"
curl -fsS https://runs-needed.vercel.app/method/ | grep -q "Wilson"; echo "expect 0: $?"
curl -fsS https://runs-needed.vercel.app/sitemap.xml >/dev/null; echo "expect 0: $?"

grep -rn "track(" src/ | grep -v "track()" | wc -l    # expect 0
node -e "const s=require('fs').readFileSync('docs/DEPENDENCIES.md','utf8');\
process.exit(/GPL|AGPL|proprietary/i.test(s)?1:0)"; echo "expect 0: $?"
```

Then, by hand, in a browser on the production URL: open the network tab, enter `x=137, n=421`, and confirm no request contains either number. The automated version of this check is `tests/e2e/privacy.spec.ts`, but do it once with your own eyes, because it is the claim the product's trustworthiness rests on.

## Report

The production URL, the exit codes, the CI run link, and the result of the manual network-tab check. **v1 is complete at this point.** Do not start Phase 10 in the same session — the cut line in `PRD.md` §12 requires that v1 be live and read by someone hostile first.
