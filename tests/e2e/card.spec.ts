import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("card: downloads a valid 1200x630 PNG over 5KB", async ({ page }) => {
  await page.goto("/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download card" }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const buf = readFileSync(path as string);

  expect(buf.length, `size ${buf.length}`).toBeGreaterThanOrEqual(5120);

  // PNG signature.
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) expect(buf[i]).toBe(sig[i]);

  // IHDR width/height (big-endian) at bytes 16-19 / 20-23.
  expect(buf.readUInt32BE(16)).toBe(1200);
  expect(buf.readUInt32BE(20)).toBe(630);
});
