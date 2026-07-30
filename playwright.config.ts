import { defineConfig, devices } from "@playwright/test";

// The app is a static export; e2e runs against the built `out/` directory served
// by a dependency-free static server. Port 4325 (not 3000) avoids colliding with
// other local dev servers; reuseExistingServer:false so Playwright always owns a
// fresh build+serve rather than reusing whatever happens to be on the port.
const PORT = 4325;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm run build && PORT=${PORT} node scripts/serve-static.mjs`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
