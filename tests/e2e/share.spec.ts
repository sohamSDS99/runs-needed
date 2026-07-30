import { test, expect } from "@playwright/test";

test("URL updates use replaceState — the back button leaves the page", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => history.length);
  // 20 keystrokes into the runs field; each recomputes and mirrors to the URL.
  await page.locator("#runs").pressSequentially("50505050505050505050", { delay: 10 });
  await page.waitForTimeout(500); // let the 300ms-debounced replaceState fire
  const after = await page.evaluate(() => history.length);
  expect(after).toBe(before); // pushState would have grown history
});

test("a degraded link shows the URL_PARAMS_IGNORED notice", async ({ page }) => {
  await page.goto("/?x=999&n=10");
  await expect(page.locator("body")).toContainText("Part of that link did not make sense");
});

test("copy-link writes the canonical share URL", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard read is only reliable in Chromium headless");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.fill("#mentions", "21");
  await page.fill("#runs", "50");
  await page.getByRole("button", { name: "Copy link" }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe("https://runs-needed.vercel.app/?x=21&n=50");
});
