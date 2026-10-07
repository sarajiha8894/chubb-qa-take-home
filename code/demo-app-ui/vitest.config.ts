import { configDefaults, defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // jsdom provides browser APIs required by React component tests.
    environment: 'jsdom',
    // Makes describe, it, and expect available throughout test files.
    globals: true,
    // Loads custom DOM matchers such as toBeVisible and toBeDisabled.
    setupFiles: ['./vitest.setup.ts'],
    // Playwright owns this directory; Vitest should only collect component tests.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      // Mirrors the application's @ import alias during test execution.
      '@': path.resolve(__dirname, '.'),
    },
  },
});
