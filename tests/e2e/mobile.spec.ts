import { test, expect } from "@playwright/test";

const VIEWPORT = { width: 390, height: 664 };

test("mobile: the interval is visible without scrolling", async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/");
  // The first paragraph of the result region is the interval, the largest text.
  const interval = page.locator('section[aria-label="Result"] p').first();
  const box = await interval.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, "interval bottom within the fold").toBeLessThanOrEqual(
      VIEWPORT.height,
    );
  }
});

test("mobile: every tap target is at least 44x44", async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/");
  // The primary tap targets (inline prose links are WCAG 2.5.5-exempt).
  const controls = page.locator(
    'button:not([aria-label="Dismiss notice"]), input:not([type="radio"]), select, [role="tab"], summary, label:has(input[type="radio"])',
  );
  const n = await controls.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const el = controls.nth(i);
    if (!(await el.isVisible())) continue;
    const b = await el.boundingBox();
    if (!b) continue;
    const label = (await el.evaluate((e) => e.tagName + " " + (e.textContent ?? "").slice(0, 20))).trim();
    expect(b.width, `width of ${label}`).toBeGreaterThanOrEqual(44);
    expect(b.height, `height of ${label}`).toBeGreaterThanOrEqual(44);
  }
});
