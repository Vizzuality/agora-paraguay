import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    // Unit tests only. End-to-end specs live in `tests/e2e` and run under Playwright,
    // which is why the include below is scoped to `tests/unit` rather than the whole
    // `tests` tree.
    //
    // Tests cover pure logic only — schemas, the mock client, map view and draw state.
    // Component tests require jsdom + testing-library.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // text-summary keeps the number visible in CI logs; lcov is the interchange
      // format editors and coverage services read.
      reporter: ['text-summary', 'lcov'],
      reportsDirectory: 'coverage',
      // Coverage is measured over the source, never over the tests themselves.
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/routeTree.gen.ts',
        // Fixtures are data, and the route tree is generated — neither is behaviour
        // worth measuring, and both would skew the number.
        'src/lib/api/fixtures/**',
      ],
    },
  },
});
