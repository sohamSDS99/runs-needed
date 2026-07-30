"use client";

import { CONFIDENCE_LEVELS } from "@/lib/stats";
import type { ConfidenceLevel } from "@/lib/stats";

interface ConfidenceSelectProps {
  id: string;
  value: ConfidenceLevel;
  onChange: (value: ConfidenceLevel) => void;
}

export function ConfidenceSelect({ id, value, onChange }: ConfidenceSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        Confidence level
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ConfidenceLevel)}
        className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {CONFIDENCE_LEVELS.map((c) => (
          <option key={c} value={c}>
            {c}%
          </option>
        ))}
      </select>
    </div>
  );
}
