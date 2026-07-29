#!/usr/bin/env python3
"""
Independent verifier for fixtures/fixtures.json.

Nothing here reuses the generator's code. Every fixture is checked three ways:

  1. Closed form recomputed from scipy.stats.norm.ppf (no hard-coded z values).
  2. The DEFINING EQUATION of the Wilson score interval solved numerically with
     brentq:  |p_hat - theta| = z * sqrt(theta*(1-theta)/n).  The Wilson bounds
     are by definition the two roots of that equation, so this validates the
     algebra of the closed form, not merely its arithmetic.
  3. statsmodels.stats.proportion.proportion_confint(method="wilson"), an
     independent third-party implementation (integer-n Mode A cases only).

Mode B required-run counts are checked by brute-force neighbourhood scan:
half-width(n) <= target AND half-width(n-1) > target.

Usage:
    pip install scipy statsmodels
    python3 scripts/verify_fixtures.py

Exit code 0 = every fixture reproduced. Exit code 1 = at least one mismatch.
"""
import json, math, os, sys

from scipy.stats import norm, beta
from scipy.optimize import brentq

try:
    from statsmodels.stats.proportion import proportion_confint
    HAVE_SM = True
except ImportError:                                    # pragma: no cover
    HAVE_SM = False

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURES = os.path.join(HERE, os.pardir, "fixtures", "fixtures.json")

TOL_PROP = 1e-12          # absolute tolerance on proportions
TOL_ROOT = 1e-9           # absolute tolerance for the numerical root check

failures = []
checks = 0


def fail(fid, msg):
    failures.append(f"{fid}: {msg}")


def close(a, b, tol=TOL_PROP):
    return abs(a - b) <= tol


def z_of(conf_pct):
    """Two-sided normal quantile for a confidence level given in percent."""
    return float(norm.ppf(1.0 - (1.0 - conf_pct / 100.0) / 2.0))


def wilson_closed_form(p_hat, n, conf_pct):
    """Closed form, with the spec's snap-then-clamp rule applied."""
    z = z_of(conf_pct)
    denom = 1.0 + z * z / n
    centre = (p_hat + z * z / (2.0 * n)) / denom
    half = (z / denom) * math.sqrt(p_hat * (1.0 - p_hat) / n + z * z / (4.0 * n * n))
    lo = 0.0 if p_hat <= 0.0 else min(1.0, max(0.0, centre - half))
    hi = 1.0 if p_hat >= 1.0 else min(1.0, max(0.0, centre + half))
    return lo, hi, half


def wilson_by_root_finding(p_hat, n, conf_pct):
    """Solve |p_hat - theta| = z*sqrt(theta(1-theta)/n) for theta in (0,1)."""
    z = z_of(conf_pct)

    def g(theta):
        return (p_hat - theta) ** 2 - z * z * theta * (1.0 - theta) / n

    eps = 1e-15
    nudge = 1e-12   # p_hat is itself a root of g; step off it at the boundaries
    if p_hat <= 0.0:
        lo, hi = 0.0, brentq(g, nudge, 1.0 - eps, xtol=1e-16, rtol=1e-15)
    elif p_hat >= 1.0:
        lo, hi = brentq(g, eps, 1.0 - nudge, xtol=1e-16, rtol=1e-15), 1.0
    else:
        lo = brentq(g, eps, p_hat, xtol=1e-16, rtol=1e-15)
        hi = brentq(g, p_hat, 1.0 - eps, xtol=1e-16, rtol=1e-15)
    return lo, hi


def half_width(p_hat, n, conf_pct):
    return wilson_closed_form(p_hat, n, conf_pct)[2]


def main():
    global checks
    with open(FIXTURES) as fh:
        data = json.load(fh)

    # --- z constants embedded in the fixture file -------------------------
    for conf, z in data["zValues"].items():
        checks += 1
        if not close(z, z_of(float(conf)), 1e-15):
            fail(f"z[{conf}]", f"expected {z_of(float(conf))!r}, file says {z!r}")

    # --- Mode A -----------------------------------------------------------
    for f in data["modeA"]:
        fid, x, n, conf = f["id"], f["x"], f["n"], f["conf"]
        p_hat = x / n

        lo1, hi1, hw1 = wilson_closed_form(p_hat, n, conf)
        for name, got, exp in (("lo", lo1, f["lo"]), ("hi", hi1, f["hi"]),
                               ("halfWidth", hw1, f["halfWidth"])):
            checks += 1
            if not close(got, exp):
                fail(fid, f"closed form {name}: got {got!r}, fixture {exp!r}")

        checks += 1
        if not close((f["hi"] - f["lo"]) * 100.0, f["widthPts"]):
            fail(fid, "widthPts inconsistent with lo/hi")

        lo2, hi2 = wilson_by_root_finding(p_hat, n, conf)
        for name, got, exp in (("lo", lo2, f["lo"]), ("hi", hi2, f["hi"])):
            checks += 1
            if not close(got, exp, TOL_ROOT):
                fail(fid, f"root-finding {name}: got {got!r}, fixture {exp!r}")

        if HAVE_SM:
            lo3, hi3 = proportion_confint(x, n, alpha=1 - conf / 100.0, method="wilson")
            for name, got, exp in (("lo", float(lo3), f["lo"]), ("hi", float(hi3), f["hi"])):
                checks += 1
                if not close(got, exp, 1e-10):
                    fail(fid, f"statsmodels {name}: got {got!r}, fixture {exp!r}")

        # Clopper-Pearson reference column (documentation only, still checked)
        a = 1.0 - conf / 100.0
        cpl = 0.0 if x == 0 else float(beta.ppf(a / 2, x, n - x + 1))
        cph = 1.0 if x == n else float(beta.ppf(1 - a / 2, x + 1, n - x))
        for name, got, exp in (("lo", cpl, f["clopperPearsonReference"]["lo"]),
                               ("hi", cph, f["clopperPearsonReference"]["hi"])):
            checks += 1
            if not close(got, exp, 1e-10):
                fail(fid, f"Clopper-Pearson {name}: got {got!r}, fixture {exp!r}")

        # Documented edge-case algebra
        if x == 0:
            checks += 1
            if f["lo"] != 0.0:
                fail(fid, "x=0 must give lower bound exactly 0.0")
        if x == n:
            checks += 1
            if f["hi"] != 1.0:
                fail(fid, "x=n must give upper bound exactly 1.0")

        checks += 1
        if not (0.0 <= f["lo"] <= f["hi"] <= 1.0):
            fail(fid, "bounds not ordered inside [0,1]")

    # --- Mode B -----------------------------------------------------------
    for f in data["modeB"]:
        fid = f["id"]
        p = f["planningPct"] / 100.0
        w = f["targetHalfWidthPts"] / 100.0
        conf, n = f["conf"], f["requiredRuns"]

        checks += 1
        if half_width(p, n, conf) > w:
            fail(fid, f"n={n} does not meet target {w}")
        if n > 1:
            checks += 1
            if half_width(p, n - 1, conf) <= w:
                fail(fid, f"n={n} is not minimal; n-1 also meets target")

        checks += 1
        if not close(half_width(p, n, conf), f["halfWidthAtN"]):
            fail(fid, "halfWidthAtN mismatch")
        if f["halfWidthAtNMinus1"] is not None:
            checks += 1
            if not close(half_width(p, n - 1, conf), f["halfWidthAtNMinus1"]):
                fail(fid, "halfWidthAtNMinus1 mismatch")

    # --- Design effect, Mode A -------------------------------------------
    for f in data["designEffectA"]:
        fid = f["id"]
        De = 1.0 + (f["runsPerPrompt"] - 1) * f["rho"]
        checks += 1
        if not close(De, f["designEffect"]):
            fail(fid, "designEffect mismatch")
        n_eff = f["n"] / De
        checks += 1
        if not close(n_eff, f["effectiveN"]):
            fail(fid, "effectiveN mismatch")
        lo, hi, hw = wilson_closed_form(f["planningPct"] / 100.0, n_eff, f["conf"])
        for name, got, exp in (("lo", lo, f["lo"]), ("hi", hi, f["hi"]),
                               ("halfWidth", hw, f["halfWidth"])):
            checks += 1
            if not close(got, exp):
                fail(fid, f"design-effect {name}: got {got!r}, fixture {exp!r}")

    # --- Design effect, Mode B -------------------------------------------
    for f in data["designEffectB"]:
        fid = f["id"]
        p = f["planningPct"] / 100.0
        w = f["targetHalfWidthPts"] / 100.0
        conf = f["conf"]
        n = f["baseRuns"]
        checks += 1
        if half_width(p, n, conf) > w or (n > 1 and half_width(p, n - 1, conf) <= w):
            fail(fid, "baseRuns is not the minimal n meeting the target")
        De = 1.0 + (f["runsPerPrompt"] - 1) * f["rho"]
        checks += 1
        if not close(De, f["designEffect"]):
            fail(fid, "designEffect mismatch")
        checks += 1
        if math.ceil(n * De) != f["requiredRuns"]:
            fail(fid, f"requiredRuns should be ceil({n}*{De})={math.ceil(n*De)}")

    # --- Report -----------------------------------------------------------
    print(f"statsmodels cross-check: {'ENABLED' if HAVE_SM else 'SKIPPED (not installed)'}")
    print(f"assertions run: {checks}")
    if failures:
        print(f"FAIL ({len(failures)} mismatches)")
        for line in failures:
            print("  -", line)
        return 1
    print("PASS - every fixture reproduced from primary sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
