import type { InterpretedLine } from "@/lib/interpret";

export interface RhoStripRow {
  rho: number;
  lower: number;
  upper: number;
  point: number;
}

interface InterpretationBlockProps {
  lines: InterpretedLine[];
  rhoStrip?: RhoStripRow[] | null | undefined;
}

// Renders each interpretation line as its own paragraph in reading order. The
// permanent caveat (GLOBAL_LOWER_BOUND) is a persistent note the reader cannot
// close, and is never placed inside a collapsible element (PRD ADR-8). When the
// clustered design is active, a forced ρ-sensitivity strip shows the interval at
// ρ = 0, 0.05, 0.1, 0.2 regardless of the current ρ.
export function InterpretationBlock({ lines, rhoStrip }: InterpretationBlockProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
      {lines.map((l) =>
        l.key === "GLOBAL_LOWER_BOUND" ? (
          <p
            key={l.key}
            className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs dark:bg-amber-950/30"
          >
            {l.text}
          </p>
        ) : (
          <p key={l.key}>{l.text}</p>
        ),
      )}

      {rhoStrip && rhoStrip.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1.5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            How the interval widens with the correlation you assume:
          </p>
          {rhoStrip.map((r) => {
            const lo = Math.max(0, Math.min(1, r.lower));
            const hi = Math.max(0, Math.min(1, r.upper));
            return (
              <div key={r.rho} data-rho={r.rho} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  ρ = {r.rho.toFixed(2)}
                </span>
                <div
                  className="relative h-2.5 flex-1 rounded bg-zinc-100 dark:bg-zinc-800"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-y-0 rounded border border-blue-600 bg-blue-600/25"
                    style={{ left: `${lo * 100}%`, width: `${Math.max(0, hi - lo) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
