import type { ConfidenceLevel, WilsonInterval } from "@/lib/stats";
import type { InterpretedLine } from "@/lib/interpret";
import { formatPct, formatPts } from "@/lib/format";
import { IntervalBar } from "./IntervalBar";
import { InterpretationBlock, type RhoStripRow } from "./InterpretationBlock";

interface ResultPanelProps {
  interval: WilsonInterval;
  pHat: number;
  confidence: ConfidenceLevel;
  designDescription: string;
  interpretation: InterpretedLine[];
  rhoStrip?: RhoStripRow[] | null | undefined;
  busy: boolean;
}

// "16.8%" -> "16.8 percent" for the screen-reader description list, which spells
// out "percent" / "percentage points" (PRD §9.1).
const words = (v: number) => formatPct(v).replace("%", " percent");

export function ResultPanel({
  interval,
  pHat,
  confidence,
  designDescription,
  interpretation,
  rhoStrip,
  busy,
}: ResultPanelProps) {
  return (
    <section
      role="region"
      aria-label="Result"
      aria-live="polite"
      aria-busy={busy || undefined}
      className={`transition-opacity duration-150 motion-reduce:transition-none ${
        busy ? "opacity-40" : "opacity-100"
      }`}
    >
      {/* 1. The interval — the largest text on the page. */}
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">
        {formatPct(interval.lower)} – {formatPct(interval.upper)}
      </p>

      {/* 2. Secondary line: point estimate demoted. */}
      <p className="mt-1 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
        point estimate {formatPct(pHat)} · width {formatPts(interval.widthPts)}{" "}
        points · {confidence}% confidence
      </p>

      {/* 3. The bar. */}
      <div className="mt-4">
        <IntervalBar lower={interval.lower} upper={interval.upper} point={pHat} />
      </div>

      {/* Authoritative, screen-reader-only description (PRD §9.1). */}
      <dl className="sr-only">
        <dt>Lower bound</dt>
        <dd>{words(interval.lower)}</dd>
        <dt>Upper bound</dt>
        <dd>{words(interval.upper)}</dd>
        <dt>Point estimate</dt>
        <dd>{words(pHat)}</dd>
        <dt>Interval width</dt>
        <dd>{formatPts(interval.widthPts)} percentage points</dd>
        <dt>Confidence level</dt>
        <dd>{confidence} percent</dd>
        <dt>Sampling design</dt>
        <dd>{designDescription}</dd>
      </dl>

      {/* 4. The interpretation — prose in the live region (PRD §6.3, §9.1). */}
      <InterpretationBlock lines={interpretation} rhoStrip={rhoStrip} />
    </section>
  );
}
