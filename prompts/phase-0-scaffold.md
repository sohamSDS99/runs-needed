# Phase 0 — Scaffold and guardrails

Branch: `phase-0-scaffold`. Estimated 45 minutes.

## Read these first

- `CLAUDE.md` — all of it, especially the five hard rules
- `CLAUDE_CODE_TASKS.md` — T01 and T02 in full
- `PRD.md` §7 ADR-1 and ADR-2 — why the build must fail rather than warn when a constraint is violated

## Build

T01 and T02. Nothing else.

The goal of this phase is not "a project exists." It is **a project that mechanically rejects the three mistakes this codebase must never contain**: a server-side runtime, an import into the statistics core, and an analytics call carrying user data. By the end of this session, all three should be impossible to commit without a red build.

## Do not

- Do not create anything under `src/app/` beyond `globals.css` and whatever the Next.js scaffold requires to build. No page content yet — that is Phase 3.
- Do not create `src/lib/stats/` files. Phase 1.
- Do not add a runtime dependency beyond `next`, `react`, `react-dom`. `@vercel/analytics` is added in Phase 9.
- Do not add a UI component library, an icon library, a form library, or a state-management library. None will be needed; Tailwind's core utilities and `useReducer` cover the whole product.
- Do not configure `images` in `next.config.ts`. Static export forbids the optimiser and there are no images.

## Definition of done

Run each of the six acceptance commands in T01 and the four in T02 and paste the exit codes. In particular, demonstrate the three guardrails **firing**:

```bash
mkdir -p src/lib/stats && printf "import React from 'react';\nexport const a=1;\n" > src/lib/stats/__probe.ts
npm run lint; echo "expect non-zero: $?"
rm src/lib/stats/__probe.ts

mkdir -p src/app/api/x && printf "export function GET(){return new Response('x')}\n" > src/app/api/x/route.ts
node scripts/check-static.mjs; echo "expect non-zero: $?"
rm -rf src/app/api

printf "declare function track(a:unknown):void;\ntrack({x:1});\n" > src/__probe.ts
npm run lint; echo "expect non-zero: $?"
rm src/__probe.ts

npm run lint; echo "expect 0: $?"
npm run typecheck; echo "expect 0: $?"
node scripts/check-no-placeholders.mjs; echo "expect 0: $?"
```

A guardrail that does not fire when probed is worse than no guardrail, because the rest of the build will trust it.

## Report

The ten exit codes, and the three probe results. If any guardrail could not be made to fire, say so plainly rather than moving on — Phase 1 depends on the import boundary being real.
