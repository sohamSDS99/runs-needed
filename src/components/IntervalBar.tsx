interface IntervalBarProps {
  /** proportions in [0, 1] */
  lower: number;
  upper: number;
  point: number;
}

// A 0–100% track with the Wilson interval as a filled band and the point
// estimate as a 2px tick. Decorative for assistive tech (PRD §6.4): the whole
// graphic is aria-hidden; the authoritative content is the text + sr-only <dl>.
export function IntervalBar({ lower, upper, point }: IntervalBarProps) {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const lo = clamp(lower);
  const hi = clamp(upper);
  const left = `${lo * 100}%`;
  const width = `${Math.max(0, hi - lo) * 100}%`;
  const tick = `${clamp(point) * 100}%`;
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div aria-hidden="true" className="select-none">
      <div className="relative h-10 w-full rounded-md bg-zinc-100 dark:bg-zinc-800">
        {/* interval band: blue-600 at 20% with a full-opacity 2px border */}
        <div
          className="absolute inset-y-0 rounded-md border-2 border-blue-600 bg-blue-600/20 transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ left, width }}
        />
        {/* point estimate: 2px tick */}
        <div
          className="absolute inset-y-0 w-0.5 bg-blue-600 transition-[left] duration-200 ease-out motion-reduce:transition-none"
          style={{ left: tick }}
        />
      </div>
      {/* axis: 0/25/50/75/100, reduced to 0/50/100 below 640px */}
      <div className="relative mt-1 h-4 text-xs text-zinc-500 dark:text-zinc-400">
        {ticks.map((t) => (
          <span
            key={t}
            className={`absolute -translate-x-1/2 tabular-nums ${
              t === 25 || t === 75 ? "hidden sm:inline" : ""
            }`}
            style={{ left: `${t}%` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
