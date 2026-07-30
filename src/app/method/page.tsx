import type { Metadata } from "next";
import Link from "next/link";
import { requiredRuns } from "@/lib/stats";
import { formatInt } from "@/lib/format";
import { NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "How this works — method, sources, and the independence problem — Runs Needed",
  description:
    "The formulas behind Runs Needed: the Wilson score interval, the required-runs table, the design effect, and the independence assumption stated in the critic's terms.",
};

const REPO = "https://github.com/sohamSDS99/runs-needed";
const SPEC = `${REPO}/blob/main/STATS_SPEC.md`;

// Canonical required-runs table, computed at build time by the same
// fixture-verified requiredRuns engine (STATS_SPEC §4, verify_fixtures.py).
const PLANNING = [10, 25, 50, 75, 90];
const TARGETS = [10, 5, 2];

// Wald-vs-Wilson coverage at nominal 95% (STATS_SPEC §3.2).
const COVERAGE = [
  { n: 10, wilsonMin: "0.9044", wilsonMean: "0.9553", waldMin: "0.0955", waldMean: "0.7762" },
  { n: 20, wilsonMin: "0.9245", wilsonMean: "0.9538", waldMin: "0.1821", waldMean: "0.8534" },
  { n: 50, wilsonMin: "0.9106", wilsonMean: "0.9501", waldMin: "0.3948", waldMean: "0.9079" },
];

const GLOSSARY: { id: string; term: string; def: string }[] = [
  {
    id: "glossary-binomial-proportion",
    term: "Binomial proportion",
    def: "A binomial proportion is the share of independent trials in which an event happened — here, the fraction of prompt runs that mentioned your brand.",
  },
  {
    id: "glossary-confidence-interval",
    term: "Confidence interval",
    def: "A confidence interval is the range of true values consistent with what you observed; a 95% confidence interval misses the true rate about 1 time in 20.",
  },
  {
    id: "glossary-wilson-score-interval",
    term: "Wilson score interval",
    def: "The Wilson score interval is the confidence interval this tool reports; unlike the textbook formula it stays inside 0–100% and keeps its coverage at small sample sizes.",
  },
  {
    id: "glossary-intracluster-correlation",
    term: "Intracluster correlation",
    def: "The intracluster correlation (ρ) measures how alike repeated runs of the same prompt are; at ρ = 0 they are independent, at ρ = 1 identical.",
  },
  {
    id: "glossary-design-effect",
    term: "Design effect",
    def: "The design effect is the factor by which correlated runs inflate the variance; your effective sample size is the raw run count divided by it.",
  },
];

export default function MethodPage() {
  return (
    <main className="mx-auto flex max-w-[44rem] flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-blue-400 uppercase">
          {NAME}
        </p>
        <h1 className="text-2xl font-semibold">How this works</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A vendor&apos;s &ldquo;visibility %&rdquo; is a binomial proportion from a
          small sample of prompt runs. This page shows the confidence interval that
          number actually supports, how many runs a target precision needs, and the
          one assumption the whole method rests on.{" "}
          <Link href="/" className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
            Back to the calculator
          </Link>
          .
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          How many prompt runs do you need to measure AI visibility?
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          It depends on the precision you want and where the true rate sits. The table
          gives the runs needed for a given half-width at 95% confidence. At a
          mid-range rate, ±5 points needs {formatInt(requiredRuns(0.5, 0.05, 95))} runs.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="mb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
              Required runs at 95% confidence
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th scope="col" className="py-1 font-medium">
                  Planning estimate
                </th>
                {TARGETS.map((w) => (
                  <th key={w} scope="col" className="py-1 text-right font-medium">
                    ±{w} points
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANNING.map((p) => (
                <tr key={p} className="border-b border-zinc-100 dark:border-zinc-900">
                  <th scope="row" className="py-1 text-left font-normal">
                    {p}%
                  </th>
                  {TARGETS.map((w) => (
                    <td key={w} className="py-1 text-right tabular-nums">
                      {formatInt(requiredRuns(p / 100, w / 100, 95))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Why is the Wilson interval better than the standard formula?
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The textbook Wald interval collapses at the small samples this tool is built
          for. A nominally 95% Wald interval at n = 10 has true coverage as low as 9.6%,
          and it returns impossible bounds outside 0–100%. The Wilson score interval
          does neither.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="mb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
              Exact coverage at nominal 95%
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th scope="col" className="py-1 font-medium">n</th>
                <th scope="col" className="py-1 text-right font-medium">Wilson min</th>
                <th scope="col" className="py-1 text-right font-medium">Wilson mean</th>
                <th scope="col" className="py-1 text-right font-medium">Wald min</th>
                <th scope="col" className="py-1 text-right font-medium">Wald mean</th>
              </tr>
            </thead>
            <tbody>
              {COVERAGE.map((r) => (
                <tr key={r.n} className="border-b border-zinc-100 dark:border-zinc-900">
                  <th scope="row" className="py-1 text-left font-normal tabular-nums">{r.n}</th>
                  <td className="py-1 text-right tabular-nums">{r.wilsonMin}</td>
                  <td className="py-1 text-right tabular-nums">{r.wilsonMean}</td>
                  <td className="py-1 text-right tabular-nums">{r.waldMin}</td>
                  <td className="py-1 text-right tabular-nums">{r.waldMean}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          What is the margin of error on a 42% visibility score?
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          From 21 mentions in 50 runs the point estimate is 42.0%, but the 95% Wilson
          confidence interval runs from 29.4% to 55.8% — a 26-point range. The single
          figure a dashboard shows hides that spread.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Are repeated prompt runs independent?</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          No, and this is the honest weak point. A binomial interval assumes independent,
          identically distributed trials, but provider-side caching, session state,
          batching, and model drift all correlate repeated runs of the same prompt. The
          direction of the error is therefore known even when its size is not: the true
          sampling variance is larger than binomial, so every interval this tool reports
          is a lower bound on total uncertainty.
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The tool exposes this through an intracluster correlation control (ρ) and its
          design effect, rather than hiding it: raising ρ widens the interval to reflect
          that repeated runs duplicate information. What would falsify the approach: if
          the dominant correlation structure is not exchangeable-within-cluster — for
          example if runs are strongly autocorrelated in time but nearly independent
          across sessions — then 1 + (R − 1)ρ is the wrong inflation model and no
          binomial interval is defensible at all. Nothing in the current evidence base
          distinguishes these cases.
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The full derivation, sources, and the two flagged assumptions are in the{" "}
          <a href={SPEC} className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
            statistical specification
          </a>{" "}
          and the{" "}
          <a href={REPO} className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
            source repository
          </a>
          .
        </p>
      </section>

      <section id="glossary" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">What do the terms mean?</h2>
        <dl className="flex flex-col gap-3 text-sm">
          {GLOSSARY.map((g) => (
            <div key={g.id}>
              <dt id={g.id} className="font-medium">
                {g.term}
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
