import { requiredRuns } from "@/lib/stats";
import type { ConfidenceLevel } from "@/lib/stats";
import { formatInt, formatPts } from "@/lib/format";
import { TARGET_MIN_PTS, TARGET_MAX_PTS } from "@/lib/stats";

interface SensitivityTableProps {
  planningPct: number;
  targetPts: number;
  confidence: ConfidenceLevel;
}

// Required runs at ½×, 1×, 2×, 4× the current target (PRD §4.3). Each target is
// clamped to [0.5, 50]; rows that collapse to the same target after clamping
// are dropped.
const MULTIPLIERS = [0.5, 1, 2, 4];

export function SensitivityTable({
  planningPct,
  targetPts,
  confidence,
}: SensitivityTableProps) {
  const seen = new Set<number>();
  const rows: { pts: number; runs: number }[] = [];
  for (const m of MULTIPLIERS) {
    const clamped = Math.min(TARGET_MAX_PTS, Math.max(TARGET_MIN_PTS, targetPts * m));
    const key = Math.round(clamped * 100) / 100;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      pts: clamped,
      runs: requiredRuns(planningPct / 100, clamped / 100, confidence),
    });
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
        If you loosen or tighten the target
      </caption>
      <thead>
        <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
          <th scope="col" className="py-1 font-medium">
            Target precision
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            Runs needed
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.pts} className="border-b border-zinc-100 dark:border-zinc-900">
            <td className="py-1 tabular-nums">±{formatPts(r.pts)} points</td>
            <td className="py-1 text-right tabular-nums">{formatInt(r.runs)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
