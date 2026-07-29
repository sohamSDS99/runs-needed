---
name: Statistical dispute
about: The math is wrong, the method is wrong, or an assumption is indefensible
title: "[stats] "
labels: statistics
---

**This is the most valuable issue type in this repository.** Thank you for taking the time.

## What is wrong

<!-- Method, formula, edge case, or assumption. Be as blunt as you like. -->

## The input

- Mentions (x):
- Runs (n):
- Confidence level:
- Sampling design and ρ, if relevant:

## Values

| | Value |
|---|---|
| What this tool produces | |
| What you believe is correct | |

## How you obtained your value

<!-- A scipy or R snippet, a textbook and page number, or a paper. Any of these
     is sufficient. If it is a snippet, please paste it so it can be run. -->

## Have you seen these already?

`STATS_SPEC.md` §7 lists everything currently flagged as an assumption, and §6 states the independence problem and what would falsify the approach. If your point is one of those, say so — an issue arguing that a known weak point is worse than we admit is still worth filing.

- [ ] I checked `STATS_SPEC.md` §7
- [ ] I ran `python3 scripts/verify_fixtures.py` and it passed / failed (delete one)
