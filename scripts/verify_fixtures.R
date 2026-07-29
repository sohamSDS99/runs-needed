#!/usr/bin/env Rscript
# Redundant third verification of fixtures/fixtures.json using base R only
# (qnorm) plus stats::binom.test for the Clopper-Pearson reference column.
# Not wired into CI - it exists so a reviewer with R and no Python can
# reproduce every fixture in one command.
#
# Usage:  Rscript scripts/verify_fixtures.R      (from the repository root)
# Requires: jsonlite  (install.packages("jsonlite"))

suppressMessages(library(jsonlite))

TOL <- 1e-12
# Run from the repository root, or from scripts/. Both paths are tried.
candidates <- c("fixtures/fixtures.json", "../fixtures/fixtures.json")
path <- candidates[file.exists(candidates)][1]
if (is.na(path)) stop("fixtures/fixtures.json not found - run this from the repository root")
fx <- fromJSON(path, simplifyDataFrame = FALSE)

z_of <- function(conf_pct) qnorm(1 - (1 - conf_pct / 100) / 2)

wilson <- function(p_hat, n, conf_pct) {
  z <- z_of(conf_pct)
  d <- 1 + z^2 / n
  centre <- (p_hat + z^2 / (2 * n)) / d
  half <- (z / d) * sqrt(p_hat * (1 - p_hat) / n + z^2 / (4 * n^2))
  lo <- if (p_hat <= 0) 0 else min(1, max(0, centre - half))
  hi <- if (p_hat >= 1) 1 else min(1, max(0, centre + half))
  c(lo = lo, hi = hi, half = half)
}

half_width <- function(p, n, conf_pct) unname(wilson(p, n, conf_pct)["half"])

fails <- character(0)
checks <- 0L
chk <- function(id, what, got, want, tol = TOL) {
  checks <<- checks + 1L
  if (!is.finite(got) || abs(got - want) > tol)
    fails <<- c(fails, sprintf("%s: %s got %.17g want %.17g", id, what, got, want))
}

for (nm in names(fx$zValues)) {
  chk(paste0("z[", nm, "]"), "quantile", fx$zValues[[nm]], z_of(as.numeric(nm)), 1e-15)
}

for (f in fx$modeA) {
  w <- wilson(f$x / f$n, f$n, f$conf)
  chk(f$id, "lo", w[["lo"]], f$lo)
  chk(f$id, "hi", w[["hi"]], f$hi)
  chk(f$id, "halfWidth", w[["half"]], f$halfWidth)
  chk(f$id, "widthPts", (f$hi - f$lo) * 100, f$widthPts)
  bt <- binom.test(f$x, f$n, conf.level = f$conf / 100)$conf.int
  chk(f$id, "Clopper-Pearson lo", bt[1], f$clopperPearsonReference$lo, 1e-9)
  chk(f$id, "Clopper-Pearson hi", bt[2], f$clopperPearsonReference$hi, 1e-9)
  if (f$x == 0) chk(f$id, "lo snapped to 0", f$lo, 0, 0)
  if (f$x == f$n) chk(f$id, "hi snapped to 1", f$hi, 1, 0)
}

for (f in fx$modeB) {
  p <- f$planningPct / 100; w <- f$targetHalfWidthPts / 100; n <- f$requiredRuns
  checks <- checks + 1L
  if (half_width(p, n, f$conf) > w)
    fails <- c(fails, sprintf("%s: n=%d misses target", f$id, n))
  if (n > 1) {
    checks <- checks + 1L
    if (half_width(p, n - 1, f$conf) <= w)
      fails <- c(fails, sprintf("%s: n=%d not minimal", f$id, n))
  }
  chk(f$id, "halfWidthAtN", half_width(p, n, f$conf), f$halfWidthAtN)
}

for (f in fx$designEffectA) {
  D <- 1 + (f$runsPerPrompt - 1) * f$rho
  chk(f$id, "designEffect", D, f$designEffect)
  chk(f$id, "effectiveN", f$n / D, f$effectiveN)
  w <- wilson(f$planningPct / 100, f$n / D, f$conf)
  chk(f$id, "lo", w[["lo"]], f$lo)
  chk(f$id, "hi", w[["hi"]], f$hi)
}

for (f in fx$designEffectB) {
  D <- 1 + (f$runsPerPrompt - 1) * f$rho
  chk(f$id, "designEffect", D, f$designEffect)
  chk(f$id, "requiredRuns", ceiling(f$baseRuns * D), f$requiredRuns, 0)
}

cat(sprintf("assertions run: %d\n", checks))
if (length(fails)) {
  cat(sprintf("FAIL (%d mismatches)\n", length(fails)))
  cat(paste0("  - ", fails, collapse = "\n"), "\n")
  quit(status = 1)
}
cat("PASS - every fixture reproduced with base R\n")
