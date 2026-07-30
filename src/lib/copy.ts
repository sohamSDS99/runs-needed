// GENERATED verbatim from PRD.md §5.3–§5.11 — do not edit by hand.
// tests/copy.test.ts re-extracts these strings from PRD.md and asserts they
// still match, so any drift fails the build. PRD §5 is the normative source.

export const COPY = Object.freeze({
  A_HEADLINE: `{x} mentions in {n} runs is {pointPct} — but the true rate could be anywhere from {lowPct} to {highPct}.`,
  WIDTH_UNUSABLE: `That's a {widthPts}-point range. At this sample size the number cannot support a decision: it cannot tell you whether you are at {lowPct} or at {highPct}, and those two answers would call for different strategies. Treat this as "we have some presence" and nothing more precise.`,
  WIDTH_DIRECTIONAL: `That's a {widthPts}-point range — enough to tell a large gap from a small one, not enough to track change over time. A move of fewer than {widthPts} points between two measurements this size is indistinguishable from noise.`,
  WIDTH_TRACKABLE: `That's a {widthPts}-point range. You can act on this: it separates a strong position from a weak one, and a change larger than about {widthPts} points between two measurements this size is unlikely to be noise alone.`,
  WIDTH_TIGHT: `That's a {widthPts}-point range — tight enough to track quarter over quarter. At this sample size the limiting factor is no longer arithmetic; it is whether your prompt set represents the questions real buyers ask.`,
  ZERO_MENTIONS: `Zero mentions in {n} runs does not mean zero visibility. It means the true rate is probably below {highPct} — you have ruled out a large presence, not established absence. To be confident the true rate is under 5% you would need 73 runs, and under 1%, 381 runs, both at 95% confidence.`,
  ALL_MENTIONS: `{n} for {n} does not mean 100%. It means the true rate is probably above {lowPct}, and the interval has no room above it to show you how much headroom you have. A clean sweep is the least informative kind of high score: it tells you the rate is high without telling you how high.`,
  SINGLE_RUN: `One run is one coin flip. The interval spans {lowPct} to {highPct}, which is almost the entire scale — that is the tool telling you a single run carries essentially no information about a rate. Two runs are not much better. The published guidance for this kind of measurement is 60 to 100 runs of the same prompt.`,
  TINY_N: `At {n} runs the interval spans {widthPts} points, which is wider than most of the differences anyone would want to detect. A measurement this small is a smoke test, not a measurement.`,
  B_HEADLINE: `To measure a rate near {planningPct} to within ±{targetPts} points at {confPct} confidence, you need {requiredRuns} runs.`,
  BUDGET_EASY: `{requiredRuns} runs is a normal working budget — reachable in an afternoon with a script. Bear in mind that it buys you ±{targetPts} points on this one measurement only; every additional prompt or engine you want to report on costs another {requiredRuns} runs.`,
  BUDGET_REAL: `{requiredRuns} runs is a real but manageable cost — an overnight scripted job, or a line item you can put in front of a client. Multiply it by the number of prompts and engines you plan to report on before you quote a price.`,
  BUDGET_HEAVY: `{requiredRuns} runs per prompt is a significant commitment. Before you spend it, check whether you need this precision: a ±{targetPts}-point target is only worth paying for if you would act differently at {loBand} than at {hiBand}. Loosening the target to ±{targetPtsRelaxed} points would cut the requirement to {requiredRunsRelaxed} runs.`,
  BUDGET_UNREALISTIC: `{requiredRuns} runs is not a realistic budget for a marketing measurement, and that is the useful finding. Precision of ±{targetPts} points at {confPct} confidence is not affordable at this scale — so if a vendor dashboard shows you a number that precise, ask how many runs are behind it. Loosening the target to ±{targetPtsRelaxed} points would bring it down to {requiredRunsRelaxed} runs.`,
  TARGET_AT_FLOOR: `±0.5 points is the tightest target this tool accepts. Below that, sampling noise stops being the thing limiting you — model drift between your first run and your last will move the true rate by more than half a point.`,
  PLANNING_EXTREME: `A planning estimate of {planningPct} sits near the edge of the scale, where the required sample size drops sharply. That makes the answer sensitive to your guess: if the true rate is closer to the middle of the range, you will need more runs than {requiredRuns}. When you are unsure, plan with 50% — it is the most demanding case, so it cannot under-size your budget.`,
  DESIGN_SINGLE: `You measured one prompt {n} times. This interval describes that one prompt's behaviour. It does not describe "your visibility in ChatGPT" — for that you would need a set of prompts sampled the way your buyers actually ask, and the variation between prompts is typically larger than the variation between runs of a single prompt.`,
  DESIGN_DISTINCT: `You ran {n} different prompts once each. This is the cleanest design this tool supports: each prompt contributes one independent observation, so the interval needs no correlation adjustment. It generalises to the population your prompts were drawn from — and if you picked them by hand, that population is "prompts you would think of", not "prompts your buyers use".`,
  DESIGN_MIXED: `You ran about {promptsK} prompts {runsPerPromptR} times each. That is {n} observations, but not {n} independent ones: repeat runs of the same prompt tell you less than runs of different prompts. At a correlation of {rhoPct}, your {n} observations carry about as much information as {effectiveN} independent ones.`,
  RHO_ZERO: `Correlation is set to 0, which assumes every run is fully independent. That is the most optimistic assumption available, and it is almost certainly wrong for repeat runs of the same prompt. Read this interval as the narrowest it could possibly be.`,
  RHO_APPLIED: `Correlation is set to {rhoPct}, which widens the interval to reflect that repeat runs of one prompt duplicate information. This figure is an input, not a measurement — no published study we could find reports an intracluster correlation for repeated LLM prompt runs, so try several values and see whether your conclusion survives all of them.`,
  B_DESIGN_INFLATED: `Because you are running {runsPerPromptR} repeats of each prompt at a correlation of {rhoPct}, the raw requirement of {baseRuns} independent observations becomes {requiredRuns} actual runs.`,
  GLOBAL_LOWER_BOUND: `This interval is a lower bound on your total uncertainty. It accounts for the randomness of sampling and nothing else. It does not account for how you chose your prompts, model updates between your first run and your last, personalisation, geography, or the provider changing something on a Tuesday. The real range is wider than what you see here.`,
  X_NOT_INTEGER: `Mentions must be a whole number — you either appeared in a run or you did not.`,
  N_NOT_INTEGER: `Runs must be a whole number.`,
  X_NEGATIVE: `Mentions cannot be negative.`,
  N_BELOW_MIN: `Enter at least 1 run.`,
  N_ABOVE_MAX: `This tool caps runs at 200,000. Above that, sampling error is no longer your main problem.`,
  X_EXCEEDS_N: `Mentions cannot be more than runs. Lower the mentions, or raise the runs.`,
  CONF_NOT_ALLOWED: `Choose one of the four confidence levels: 80%, 90%, 95%, or 99%.`,
  RHO_OUT_OF_RANGE: `Correlation must be between 0 and 0.9.`,
  RUNS_PER_PROMPT_BELOW_MIN: `Runs per prompt must be at least 1.`,
  RUNS_PER_PROMPT_EXCEEDS_N: `Runs per prompt cannot be more than your total runs.`,
  PLANNING_OUT_OF_RANGE: `The planning estimate must be between 0% and 100%.`,
  TARGET_BELOW_MIN: `The tightest target this tool accepts is ±0.5 points.`,
  TARGET_ABOVE_MAX: `The loosest target this tool accepts is ±50 points, which is the whole scale.`,
  URL_PARAMS_IGNORED: `Part of that link did not make sense, so we have filled in the defaults. Your numbers may not match what the sender saw.`,
} as const);

export type CopyKey = keyof typeof COPY;

// Product-judgement thresholds (STATS_SPEC §7 items 4–5).
export const WIDTH_THRESHOLDS = [8, 15, 30] as const;
export const BUDGET_THRESHOLDS = [100, 500, 2000] as const;
