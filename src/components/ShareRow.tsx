"use client";

import { useState } from "react";
import type { CardData } from "@/lib/card";

interface ShareRowProps {
  url: string;
  card: CardData;
  downloadName: string;
}

// Copy-link + result-card download (PRD §11). The card module is imported
// lazily on click so its Canvas code never enters the "/" route bundle.
export function ShareRow({ url, card, downloadName }: ShareRowProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadCard = async () => {
    const { drawResultCard } = await import("@/lib/card");
    const blob = await drawResultCard(card);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const btn =
    "min-h-11 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={copy} className={btn}>
        Copy link
      </button>
      <button type="button" onClick={downloadCard} className={btn}>
        Download card
      </button>
      <span aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
