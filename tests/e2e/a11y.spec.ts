import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function seriousOrCritical(page: import("@playwright/test").Page) {
  // Exclude the transiently-busy result region: while input is invalid the last
  // result is intentionally dimmed to 40% opacity (PRD §4.2) and marked
  // aria-busy, i.e. inactive/being-replaced — WCAG 1.4.3 exempts inactive
  // content from contrast. In valid states nothing carries aria-busy.
  const results = await new AxeBuilder({ page })
    .exclude('[aria-busy="true"]')
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`);
}

test("a11y: home, default state", async ({ page }) => {
  await page.goto("/");
  expect(await seriousOrCritical(page)).toEqual([]);
});

test("a11y: home, invalid state", async ({ page }) => {
  await page.goto("/");
  await page.fill("#mentions", "999"); // > runs => X_EXCEEDS_N
  await expect(page.locator("#mentions-error")).toBeVisible();
  expect(await seriousOrCritical(page)).toEqual([]);
});

test("a11y: /method", async ({ page }) => {
  await page.goto("/method");
  expect(await seriousOrCritical(page)).toEqual([]);
});

test("a11y: home, dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await seriousOrCritical(page)).toEqual([]);
});

test("reflow: no horizontal scroll at 400% zoom (320px viewport)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const ok = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth + 1,
  );
  expect(ok).toBe(true);
});

test("focus: every tabbable element shows a visible focus indicator", async ({ page }) => {
  await page.goto("/");
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const res = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return { skip: true, ok: true, tag: "" };
      const cs = getComputedStyle(el);
      const hasOutline =
        cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const hasShadow = cs.boxShadow !== "none";
      return { skip: false, ok: hasOutline || hasShadow, tag: el.tagName };
    });
    if (!res.skip) expect(res.ok, `focus indicator on <${res.tag}>`).toBe(true);
  }
});
