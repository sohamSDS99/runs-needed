#!/usr/bin/env python3
"""Exhaustive check of the claim in STATS_SPEC.md section 4.2: the Wilson
half-width h(p, n, z) is strictly decreasing in n, which is what makes the
binary search in Mode B well defined.

Usage: pip install scipy && python3 scripts/monotonicity.py
Exit 0 = no violations.
"""
import math
import sys
from scipy.stats import norm

CONFS = (80, 90, 95, 99)
PS = (0.0, 0.01, 0.05, 0.1, 0.25, 0.42, 0.5, 0.75, 0.9, 0.97, 0.99, 1.0)
N_MAX = 20000


def z_of(conf_pct):
    return float(norm.ppf(1 - (1 - conf_pct / 100) / 2))


def half_width(p, n, z):
    d = 1 + z * z / n
    return (z / d) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))


violations = []
for conf in CONFS:
    z = z_of(conf)
    for p in PS:
        prev = None
        for n in range(1, N_MAX + 1):
            h = half_width(p, n, z)
            if prev is not None and h >= prev:
                violations.append((conf, p, n, prev, h))
                break
            prev = h

cells = len(CONFS) * len(PS) * N_MAX
print(f"checked {cells:,} (confidence, p, n) points; n = 1..{N_MAX:,}")
if violations:
    print(f"FAIL - {len(violations)} violations")
    for v in violations[:20]:
        print("  conf=%s p=%s n=%s prev=%r h=%r" % v)
    sys.exit(1)
print("PASS - half-width strictly decreasing in n at every point checked")
