import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    // Tests cover pure logic only — schemas, the mock client, map view state.
    // Component tests require jsdom + testing-library.
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // text-summary keeps the number visible in CI logs; lcov is the interchange
      // format editors and coverage services read.
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/routeTree.gen.ts",
        // Fixtures are data, and the route tree is generated — neither is behaviour
        // worth measuring, and both would skew the number.
        "src/lib/api/fixtures/**",
      ],
    },
  },
});
