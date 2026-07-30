import { test, expect } from "@playwright/test";

// PRD §9.4: the figures a user types must never leave the browser. We record
// every outbound request during a full interaction session and assert none
// carries the entered numbers, and that every host is the test origin or the
// analytics beacon. (We inspect query strings and POST bodies rather than whole
// URLs so a coincidental chunk id like "137-*.js" can't false-positive.)
test("privacy: entered figures never leave the browser", async ({ page }) => {
  const offenders: string[] = [];
  const hosts = new Set<string>();

  page.on("request", (req) => {
    const url = req.url();
    let search = "";
    try {
      const u = new URL(url);
      hosts.add(u.host);
      search = u.search;
    } catch {
      /* ignore */
    }
    const body = req.postData() ?? "";
    for (const needle of ["137", "421"]) {
      if (search.includes(needle) || body.includes(needle)) offenders.push(url);
    }
  });

  await page.goto("/");
  await page.fill("#mentions", "137");
  await page.fill("#runs", "421");
  await page.getByRole("tab", { name: "Plan runs needed" }).click();
  await page.getByRole("tab", { name: "Measure a result" }).click();
  await page.waitForTimeout(600); // allow any debounced work to settle

  expect(offenders, `requests carrying the figures: ${offenders.join(", ")}`).toEqual([]);

  const allowed = new Set(["localhost:4325", "va.vercel-scripts.com"]);
  const unexpected = [...hosts].filter((h) => !allowed.has(h));
  expect(unexpected, `unexpected hosts: ${unexpected.join(", ")}`).toEqual([]);
});
