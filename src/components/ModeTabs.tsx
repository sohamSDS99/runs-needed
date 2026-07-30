"use client";

import type { KeyboardEvent } from "react";
import type { Mode } from "@/lib/appState";

interface ModeTabsProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const TABS: { id: Mode; label: string }[] = [
  { id: "a", label: "Measure a result" },
  { id: "b", label: "Plan runs needed" },
];

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === mode);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    const target = TABS[next];
    if (!target) return;
    onChange(target.id);
    const el = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next];
    el?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Calculator mode"
      onKeyDown={onKeyDown}
      className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
    >
      {TABS.map((t) => {
        const selected = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              selected
                ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-950 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
