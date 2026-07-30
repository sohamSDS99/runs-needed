import { defineConfig } from "vitest/config";
import StableReporter from "./tests/reporters/stableReporter";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    // default reporter for humans; stable footer so `npm test | tail` is
    // reproducible (see tests/reporters/stableReporter.ts and T09-AC3).
    reporters: ["default", new StableReporter()],
  },
});
