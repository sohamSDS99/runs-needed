"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { NAME, DESCRIPTION, CANONICAL_BASE } from "@/lib/brand";
import { NumberField } from "@/components/NumberField";
import { ConfidenceSelect } from "@/components/ConfidenceSelect";
import { DesignRadio } from "@/components/DesignRadio";
import { AdvancedDisclosure } from "@/components/AdvancedDisclosure";
import { ResultPanel } from "@/components/ResultPanel";
import { ModeTabs } from "@/components/ModeTabs";
import { SensitivityTable } from "@/components/SensitivityTable";
import { InterpretationBlock, type RhoStripRow } from "@/components/InterpretationBlock";
import { ShareRow } from "@/components/ShareRow";
import { Faq } from "@/components/Faq";
import {
  reducer,
  DEFAULT_FORM,
  computeModeA,
  computeModeB,
  formToModeAInput,
  formToModeBInput,
  formToAppState,
  appStateToForm,
  describeSamplingDesign,
  type FormState,
} from "@/lib/appState";
import {
  validateModeA,
  validateModeB,
  designEffect,
  effectiveSampleSize,
  wilsonFromProportion,
  RHO_PRESETS,
} from "@/lib/stats";
import type { ConfidenceLevel, ErrorCode } from "@/lib/stats";
import { interpretModeA, interpretModeB } from "@/lib/interpret";
import { COPY } from "@/lib/copy";
import { parse, serialise } from "@/lib/urlState";
import { formatInt, formatOneDp, formatPct, formatPts } from "@/lib/format";
import type { CardData } from "@/lib/card";

type Field =
  | "mentions"
  | "runs"
  | "confidence"
  | "rho"
  | "runsPerPrompt"
  | "planning"
  | "target";

const FIELD: Record<ErrorCode, Field> = {
  X_NOT_INTEGER: "mentions",
  X_NEGATIVE: "mentions",
  X_EXCEEDS_N: "mentions",
  N_NOT_INTEGER: "runs",
  N_BELOW_MIN: "runs",
  N_ABOVE_MAX: "runs",
  CONF_NOT_ALLOWED: "confidence",
  RHO_OUT_OF_RANGE: "rho",
  RUNS_PER_PROMPT_BELOW_MIN: "runsPerPrompt",
  RUNS_PER_PROMPT_EXCEEDS_N: "runsPerPrompt",
  PLANNING_OUT_OF_RANGE: "planning",
  TARGET_BELOW_MIN: "target",
  TARGET_ABOVE_MAX: "target",
};

function rhoStripFor(f: FormState): RhoStripRow[] {
  const runs = Number(f.runs);
  const pHat = Number(f.mentions) / runs;
  return RHO_PRESETS.map((rho) => {
    const D = designEffect(Number(f.runsPerPrompt), rho);
    const iv = wilsonFromProportion(pHat, effectiveSampleSize(runs, D), f.confidence);
    return { rho, lower: iv.lower, upper: iv.upper, point: pHat };
  });
}

export default function Home() {
  const [form, dispatch] = useReducer(reducer, DEFAULT_FORM);
  const [degraded, setDegraded] = useState(false);
  const [ready, setReady] = useState(false);
  const isA = form.mode === "a";

  // Read the URL on mount and mirror it back (debounced) as state changes.
  // Only ever replaceState — the back button must leave the page, not step
  // through keystrokes (PRD §6.2, ADR-3).
  useEffect(() => {
    const search = window.location.search;
    // Only hydrate when the URL actually carries params — otherwise we would
    // dispatch the default form and clobber anything typed before this effect.
    if (search && search !== "?") {
      const parsed = parse(new URLSearchParams(search));
      dispatch({ type: "hydrate", value: appStateToForm(parsed.state) });
      setDegraded(parsed.degraded);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const query = serialise(formToAppState(form));
      window.history.replaceState(null, "", `${window.location.pathname}${query}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form, ready]);

  const error = isA
    ? validateModeA(formToModeAInput(form))
    : validateModeB(formToModeBInput(form));
  const message = error ? COPY[error] : null;
  const errField: Field | null = error ? FIELD[error] : null;
  const errFor = (f: Field) => (errField === f ? message : null);
  const busy = Boolean(error);

  const lastFormA = useRef<FormState>(DEFAULT_FORM);
  const lastFormB = useRef<FormState>(DEFAULT_FORM);
  if (isA && !error) lastFormA.current = form;
  if (!isA && !error) lastFormB.current = form;

  const shownFormA = isA && !error ? form : lastFormA.current;
  const shownFormB = !isA && !error ? form : lastFormB.current;

  const resultA = computeModeA(shownFormA);
  const stateA = formToAppState(shownFormA);
  const interpretationA = interpretModeA(stateA, resultA.interval, resultA.designEffectValue);
  const rhoStrip = shownFormA.design === "mixed" ? rhoStripFor(shownFormA) : null;

  const resultB = computeModeB(shownFormB);
  const stateB = formToAppState(shownFormB);
  const interpretationB = interpretModeB(stateB, resultB);

  const shareUrl = `${CANONICAL_BASE}/${serialise(formToAppState(form))}`;

  const caveat = (() => {
    const s = COPY.GLOBAL_LOWER_BOUND;
    const i = s.indexOf(". ");
    return i === -1 ? s : s.slice(0, i + 1);
  })();

  const cardData: CardData = isA
    ? {
        wordmark: NAME,
        primary: `${formatPct(resultA.interval.lower)} – ${formatPct(resultA.interval.upper)}`,
        secondary: `point estimate ${formatPct(resultA.pHat)} · width ${formatPts(resultA.interval.widthPts)} points · ${shownFormA.confidence}% confidence`,
        bar: {
          lower: resultA.interval.lower,
          upper: resultA.interval.upper,
          point: resultA.pHat,
        },
        classSentence: interpretationA[1]?.text ?? "",
        caveat,
        url: shareUrl,
      }
    : {
        wordmark: NAME,
        primary: `${formatInt(resultB.requiredRuns)} runs`,
        secondary: `to measure a rate near ${resultB.planningPct}% to within ±${formatPts(resultB.targetPts)} points at ${shownFormB.confidence}% confidence`,
        bar: null,
        classSentence: interpretationB[1]?.text ?? "",
        caveat,
        url: shareUrl,
      };
  const downloadName = isA
    ? `runs-needed-a-${resultA.mentions}-of-${resultA.runs}.png`
    : `runs-needed-b-${resultB.requiredRuns}-runs.png`;

  return (
    <main className="mx-auto flex max-w-[44rem] flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-blue-400 uppercase">
          {NAME}
        </p>
        <h1 className="text-2xl font-semibold text-balance">{DESCRIPTION}</h1>
      </header>

      {degraded ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <p>{COPY.URL_PARAMS_IGNORED}</p>
          <button
            type="button"
            onClick={() => setDegraded(false)}
            aria-label="Dismiss notice"
            className="shrink-0 px-1 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ×
          </button>
        </div>
      ) : null}

      <ModeTabs mode={form.mode} onChange={(m) => dispatch({ type: "mode", value: m })} />

      <div
        role="tabpanel"
        id={`panel-${form.mode}`}
        aria-labelledby={`tab-${form.mode}`}
        className="flex flex-col gap-6"
      >
        <form className="flex flex-col gap-4" noValidate>
          {isA ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="mentions"
                label="Mentions"
                value={form.mentions}
                onChange={(v) => dispatch({ type: "mentions", value: v })}
                error={errFor("mentions")}
                min={0}
                step={1}
              />
              <NumberField
                id="runs"
                label="Runs"
                value={form.runs}
                onChange={(v) => dispatch({ type: "runs", value: v })}
                error={errFor("runs")}
                min={1}
                step={1}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="planning"
                label="Planning estimate"
                value={form.planningPct}
                onChange={(v) => dispatch({ type: "planningPct", value: v })}
                error={errFor("planning")}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
              />
              <NumberField
                id="target"
                label="Target precision"
                value={form.targetHalfWidthPts}
                onChange={(v) => dispatch({ type: "targetHalfWidthPts", value: v })}
                error={errFor("target")}
                min={0.5}
                max={50}
                step={0.5}
                prefix="±"
                suffix="points"
              />
            </div>
          )}
        </form>

        {isA ? (
          <ResultPanel
            interval={resultA.interval}
            pHat={resultA.pHat}
            confidence={shownFormA.confidence}
            designDescription={describeSamplingDesign(shownFormA)}
            interpretation={interpretationA}
            rhoStrip={rhoStrip}
            busy={busy}
          />
        ) : (
          <ModeBOutput
            requiredRuns={resultB.requiredRuns}
            baseRuns={resultB.baseRuns}
            designEffectValue={resultB.designEffectValue}
            halfWidthAtN={resultB.halfWidthAtN}
            halfWidthAtNMinus1={resultB.halfWidthAtNMinus1}
            planningPct={resultB.planningPct}
            targetPts={resultB.targetPts}
            confidence={shownFormB.confidence}
            interpretation={interpretationB}
            busy={busy}
          />
        )}

        {/* Secondary controls: placed after the result so the interval stays
            above the fold on mobile (PRD §6.5). */}
        <div className="flex flex-col gap-4">
          <ConfidenceSelect
            id="confidence"
            value={form.confidence}
            onChange={(v) => dispatch({ type: "confidence", value: v })}
          />

          <DesignRadio
            value={form.design}
            onChange={(v) => dispatch({ type: "design", value: v })}
          />

          <AdvancedDisclosure
            design={form.design}
            rho={form.rho}
            onRhoChange={(v) => dispatch({ type: "rho", value: v })}
            rhoError={errFor("rho")}
            runsPerPrompt={form.runsPerPrompt}
            onRunsPerPromptChange={(v) => dispatch({ type: "runsPerPrompt", value: v })}
            runsPerPromptError={errFor("runsPerPrompt")}
          />
        </div>

        <ShareRow url={shareUrl} card={cardData} downloadName={downloadName} />
      </div>

      <section className="text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          A vendor&apos;s &ldquo;visibility %&rdquo; is a binomial proportion
          from a small sample. This tool converts it into the Wilson confidence
          interval it actually supports, and inverts that to the runs a target
          precision requires.{" "}
          <Link
            href="/method"
            className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2"
          >
            How this works
          </Link>
          .
        </p>
      </section>

      <Faq />

      <footer className="mt-4 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          The numbers you type never leave your browser. Code under{" "}
          <a
            href="https://github.com/sohamSDS99/runs-needed/blob/main/LICENSE"
            className="underline underline-offset-2"
          >
            MIT
          </a>
          , prose under CC BY 4.0.{" "}
          <a
            href="https://github.com/sohamSDS99/runs-needed"
            className="underline underline-offset-2"
          >
            Source
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

interface ModeBOutputProps {
  requiredRuns: number;
  baseRuns: number;
  designEffectValue: number;
  halfWidthAtN: number;
  halfWidthAtNMinus1: number | null;
  planningPct: number;
  targetPts: number;
  confidence: ConfidenceLevel;
  interpretation: ReturnType<typeof interpretModeB>;
  busy: boolean;
}

function ModeBOutput({
  requiredRuns,
  baseRuns,
  designEffectValue,
  halfWidthAtN,
  halfWidthAtNMinus1,
  planningPct,
  targetPts,
  confidence,
  interpretation,
  busy,
}: ModeBOutputProps) {
  const inflated = designEffectValue > 1;
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
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">
        {formatInt(requiredRuns)} runs
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        to measure a rate near {planningPct}% to within ±{formatPts(targetPts)} points
        at {confidence}% confidence
      </p>

      <p className="mt-3 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
        At {formatInt(baseRuns)} runs the half-width is ±{formatPts(halfWidthAtN * 100)}{" "}
        points
        {halfWidthAtNMinus1 !== null
          ? `; at ${formatInt(baseRuns - 1)} it is ±${formatPts(halfWidthAtNMinus1 * 100)} points`
          : ""}
        .
      </p>

      {inflated ? (
        <p className="mt-1 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
          Base requirement {formatInt(baseRuns)} independent observations × design
          effect {formatOneDp(designEffectValue)} = {formatInt(requiredRuns)} runs.
        </p>
      ) : null}

      <div className="mt-4">
        <SensitivityTable
          planningPct={planningPct}
          targetPts={targetPts}
          confidence={confidence}
        />
      </div>

      <InterpretationBlock lines={interpretation} />
    </section>
  );
}
