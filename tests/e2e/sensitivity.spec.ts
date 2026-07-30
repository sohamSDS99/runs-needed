import { test, expect } from "@playwright/test";

test("clustered design forces a rho-sensitivity strip of four bars", async ({ page }) => {
  await page.goto("/");
  // Mode A is the default; selecting the clustered design must reveal the strip
  // regardless of the current rho (PRD ADR-8, mechanism 3).
  await page.getByRole("radio", { name: "Several prompts, several runs each" }).check();
  await expect(page.locator("[data-rho]")).toHaveCount(4);
});
