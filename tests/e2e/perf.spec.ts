import { test, expect } from "@playwright/test";

// PRD §9.2. Network + CPU throttling uses CDP, which is Chromium-only.
test("performance: LCP, CLS, and INP within budget (Slow 4G, 4x CPU)", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CDP throttling is Chromium-only");

  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    // Standard "Slow 4G" profile (Lighthouse mobile): 1.6 Mbps down / 750 Kbps
    // up / 150 ms RTT, paired with the 4x CPU throttle below.
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  // Set up INP capture before navigation.
  await page.addInitScript(() => {
    (window as unknown as { __inp: number[] }).__inp = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const ev = e as PerformanceEntry & { interactionId?: number };
        if (ev.interactionId) (window as unknown as { __inp: number[] }).__inp.push(e.duration);
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 0 } as PerformanceObserverInit);
  });

  await page.goto("/", { waitUntil: "load" });

  const lcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let value = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            value = (e as PerformanceEntry & { renderTime?: number; startTime: number }).renderTime || e.startTime;
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve(value), 600);
      }),
  );
  expect(lcp, `LCP ${Math.round(lcp)}ms`).toBeLessThan(1500);

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let sum = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            const ls = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!ls.hadRecentInput) sum += ls.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(sum), 300);
      }),
  );
  expect(cls, `CLS ${cls.toFixed(4)}`).toBeLessThan(0.02);

  // 20 real keystrokes into the runs field.
  const runs = page.locator("#runs");
  await runs.click();
  for (let i = 0; i < 20; i++) {
    await runs.press("Backspace");
    await runs.press(String((i % 9) + 1));
  }
  await page.waitForTimeout(300);
  const inp = await page.evaluate(() => {
    const arr = (window as unknown as { __inp: number[] }).__inp;
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  });
  expect(inp, `INP avg ${Math.round(inp)}ms`).toBeLessThan(50);
});
