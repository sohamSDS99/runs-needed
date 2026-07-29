# Phase prompts

One file per roadmap phase from `PRD.md` §12. Each is a **session-opening brief**: paste it as the first message of a fresh Claude Code session, in a clean working tree, on a branch named after the phase.

## How to use these

```bash
git checkout -b phase-1-stats-core
claude          # then paste the contents of phase-1-stats-core.md
```

Every prompt follows the same shape, and the shape matters:

1. **Read these first** — the exact documents and sections to load before writing code. An agent that skips this step will invent a formula.
2. **Build** — the tasks from `CLAUDE_CODE_TASKS.md` covered by this phase.
3. **Do not** — the specific wrong turns available in this phase. This section is derived from real failure modes, not generic caution.
4. **Definition of done** — the shell commands to run, all of which must exit 0.
5. **Report** — what to tell the human at the end.

## Ordering

Phases 0 through 9 are v1 and are strictly sequential — each one's exit criteria are the next one's assumptions. **Phases 1 and 2 must both be complete before any file exists under `src/app/` or `src/components/`.** That is not a style preference: `PRD.md` ADR-4 requires the statistics core to be provably standalone, and the only proof is that it was written and tested before anything could import it.

Phases 10 through 13 are post-v1 and are gated on v1 being live and having been read by someone hostile. Phase 11 additionally requires a human decision that has not been made — see its file.

| File | Phase | Tasks | Est. hours |
|---|---|---|---|
| `phase-0-scaffold.md` | 0 — Scaffold and guardrails | T01–T02 | 0.75 |
| `phase-1-stats-core.md` | 1 — The math | T03–T07 | 1.5 |
| `phase-2-verification.md` | 2 — Proof the math is correct | T08–T10 | 1.25 |
| `phase-3-mode-a-ui.md` | 3 — Mode A usable | T11–T15 | 1.75 |
| `phase-4-mode-b-ui.md` | 4 — Mode B usable | T16 | 1.0 |
| `phase-5-interpretation.md` | 5 — The interpretation layer | T17–T19 | 1.25 |
| `phase-6-url-state-share.md` | 6 — Shareable results | T20–T21 | 1.0 |
| `phase-7-method-a11y-perf.md` | 7 — Defensible in public | T22–T24 | 1.5 |
| `phase-8-result-card.md` | 8 — Screenshot-portable results | T25 | 1.0 |
| `phase-9-deploy.md` | 9 — Live | T26 | 0.75 |
| — | **v1 total** | **T01–T26** | **11.75** |
| `phase-10-comparison-mode.md` | 10 — Before/after comparison | post-v1 | 3.0 |
| `phase-11-stratified-engines.md` | 11 — Multi-engine stratified | post-v1 | 4.5 |
| `phase-12-embeddable-widget.md` | 12 — Embeddable widget | post-v1 | 3.0 |
| `phase-13-measured-rho.md` | 13 — Replace the ρ assumption | post-v1 | 6.0 |

## One rule that applies to every phase

If a document and your instinct disagree, the document wins and the disagreement is worth reporting. If two documents disagree, the precedence order in `CLAUDE.md` decides it, and that conflict is a bug — report it rather than picking a side silently.
