"use client";

import { useEffect, useState } from "react";
import { RHO_PRESETS } from "@/lib/stats";
import type { Design } from "@/lib/stats";
import { NumberField } from "./NumberField";

interface AdvancedDisclosureProps {
  design: Design;
  rho: string;
  onRhoChange: (raw: string) => void;
  rhoError?: string | null;
  runsPerPrompt: string;
  onRunsPerPromptChange: (raw: string) => void;
  runsPerPromptError?: string | null;
}

export function AdvancedDisclosure({
  design,
  rho,
  onRhoChange,
  rhoError,
  runsPerPrompt,
  onRunsPerPromptChange,
  runsPerPromptError,
}: AdvancedDisclosureProps) {
  const isMixed = design === "mixed";
  // Open automatically when the clustered design is selected (PRD §4.1).
  const [open, setOpen] = useState(isMixed);
  useEffect(() => {
    if (isMixed) setOpen(true);
  }, [isMixed]);

  const rhoNum = Number(rho);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
        Adjust for repeat-run correlation (advanced)
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Correlation presets (ρ)</span>
          <div role="group" aria-label="Correlation presets" className="flex gap-2">
            {RHO_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onRhoChange(String(preset))}
                aria-pressed={Math.abs(rhoNum - preset) < 1e-9}
                className="min-h-11 min-w-11 rounded-md border border-zinc-300 px-3 py-1 text-sm aria-pressed:border-blue-600 aria-pressed:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:aria-pressed:bg-blue-950"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <NumberField
          id="rho"
          label="Intracluster correlation ρ"
          value={rho}
          onChange={onRhoChange}
          error={rhoError}
          step={0.05}
          min={0}
          max={0.9}
        />

        {isMixed ? (
          <NumberField
            id="runs-per-prompt"
            label="Average runs per prompt"
            value={runsPerPrompt}
            onChange={onRunsPerPromptChange}
            error={runsPerPromptError}
            step={1}
            min={1}
          />
        ) : null}
      </div>
    </details>
  );
}
