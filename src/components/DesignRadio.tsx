"use client";

import type { Design } from "@/lib/stats";

interface DesignRadioProps {
  value: Design;
  onChange: (value: Design) => void;
}

const OPTIONS: { value: Design; label: string }[] = [
  { value: "single", label: "One prompt, run many times" },
  { value: "distinct", label: "Different prompts, once each" },
  { value: "mixed", label: "Several prompts, several runs each" },
];

export function DesignRadio({ value, onChange }: DesignRadioProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">Sampling design</legend>
      <div role="radiogroup" aria-label="Sampling design" className="flex flex-col gap-1">
        {OPTIONS.map((o) => (
          <label key={o.value} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="design"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="size-4 accent-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
