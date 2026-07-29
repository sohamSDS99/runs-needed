## What this changes

<!-- One or two sentences. -->

## Which task or issue

<!-- e.g. "T14 from CLAUDE_CODE_TASKS.md" or "closes #12" -->

## Constraint checklist

Every box must be checked. Each one is load-bearing — see `CONTRIBUTING.md`.

- [ ] No backend, API route, server action, or `"use server"` added
- [ ] No new runtime dependency (the list is `next`, `react`, `react-dom`, `@vercel/analytics`)
- [ ] Nothing inside `src/lib/stats/` imports from outside that directory
- [ ] No `localStorage`, `sessionStorage`, or cookie use
- [ ] No analytics call carries an argument
- [ ] No fixture in `fixtures/fixtures.json` was edited
- [ ] None of the four scripts in `scripts/` frozen by T10 were edited
- [ ] If user-facing copy changed, `PRD.md` §5 was changed first and `copy.ts` matches it

## Verification

```
npm run verify                        # exit code:
python3 scripts/verify_fixtures.py    # exit code:
```

## If this changes a number

State the input, the old value, the new value, and the independent source that confirms the new one.
