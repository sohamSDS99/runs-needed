#!/usr/bin/env python3
"""Reproduces the Wilson-vs-Wald coverage table in STATS_SPEC.md section 3.2.

Exact coverage probability of a nominal 95% interval:
    C(theta) = sum_x 1{L(x) <= theta <= U(x)} * Binom(x; n, theta)
evaluated on a grid of theta.

Usage: pip install scipy && python3 scripts/coverage.py
"""
import math
from scipy.stats import norm, binom

CONF = 0.95
Z = float(norm.ppf(1 - (1 - CONF) / 2))


def wilson(x, n):
    p = x / n
    d = 1 + Z * Z / n
    c = (p + Z * Z / (2 * n)) / d
    h = (Z / d) * math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))
    lo = 0.0 if p <= 0 else min(1.0, max(0.0, c - h))
    hi = 1.0 if p >= 1 else min(1.0, max(0.0, c + h))
    return lo, hi


def wald(x, n):
    p = x / n
    h = Z * math.sqrt(p * (1 - p) / n)
    return p - h, p + h


def coverage(n, method):
    out = []
    for i in range(1, 100):
        theta = i / 100
        total = 0.0
        for x in range(n + 1):
            lo, hi = method(x, n)
            if lo <= theta <= hi:
                total += float(binom.pmf(x, n, theta))
        out.append(total)
    return min(out), sum(out) / len(out)


print(f"nominal coverage: {CONF:.0%}   theta grid: 0.01..0.99 step 0.01\n")
print(f"{'n':>4}  {'Wilson min':>11} {'Wilson mean':>12}  {'Wald min':>9} {'Wald mean':>10}")
for n in (10, 20, 50):
    wmin, wmean = coverage(n, wilson)
    amin, amean = coverage(n, wald)
    print(f"{n:>4}  {wmin:>11.4f} {wmean:>12.4f}  {amin:>9.4f} {amean:>10.4f}")
