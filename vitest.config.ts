import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    // Phase 0 covers schemas and the mock client — neither needs a DOM.
    // Add jsdom + testing-library when the first component test arrives.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
