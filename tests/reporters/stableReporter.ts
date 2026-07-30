/**
 * A deterministic-tail reporter used alongside vitest's default reporter.
 *
 * The default reporter ends every run with a `Duration ...ms` line, which
 * varies run to run and makes `npm test | tail -n` non-reproducible. This
 * reporter appends a short footer built ONLY from the pass/fail/skip counts
 * (no timings, no timestamps). The footer is therefore identical across two
 * runs iff the run itself is deterministic — which is exactly what T09's
 * determinism check is meant to assert.
 */
interface TaskLike {
  type?: string;
  result?: { state?: string };
  tasks?: TaskLike[];
}

interface FileLike {
  tasks?: TaskLike[];
}

function count(
  tasks: TaskLike[] | undefined,
  acc: { total: number; pass: number; fail: number; skip: number },
): void {
  for (const t of tasks ?? []) {
    if (t.type === "test") {
      acc.total++;
      const s = t.result?.state;
      if (s === "pass") acc.pass++;
      else if (s === "fail") acc.fail++;
      else acc.skip++;
    }
    count(t.tasks, acc);
  }
}

export default class StableReporter {
  onFinished(files: FileLike[] = []): void {
    const acc = { total: 0, pass: 0, fail: 0, skip: 0 };
    for (const f of files) count(f.tasks, acc);
    const line = `stable-summary total=${acc.total} pass=${acc.pass} fail=${acc.fail} skip=${acc.skip}`;
    // Five identical count lines so `tail -5` captures only this footer,
    // never the default reporter's timing line above it.
    console.log(
      ["", "==== deterministic tail (no timings) ====", line, line, line, line, line].join("\n"),
    );
  }
}
