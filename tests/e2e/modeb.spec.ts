import { test, expect } from "@playwright/test";

test("Mode B computes required runs and proves minimality", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Plan runs needed" }).click();

  await page.fill("#planning", "50");
  await page.fill("#target", "5");

  const main = page.locator("main");
  // 381 = requiredRuns(0.5, 0.05, 95); 380 = the n-1 minimality line.
  await expect(main).toContainText("381");
  await expect(main).toContainText("380");
});

test("mode switch preserves both modes' inputs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Plan runs needed" }).click();
  await page.fill("#planning", "50");
  await page.fill("#target", "5");

  await page.getByRole("tab", { name: "Measure a result" }).click();
  await page.getByRole("tab", { name: "Plan runs needed" }).click();

  await expect(page.locator("#planning")).toHaveValue("50");
  await expect(page.locator("#target")).toHaveValue("5");
});

test("sensitivity table collapses to 3 rows or fewer at w=50", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Plan runs needed" }).click();
  await page.fill("#planning", "50");
  await page.fill("#target", "50");

  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBeLessThanOrEqual(3);
});
