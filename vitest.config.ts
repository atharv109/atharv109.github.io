import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs live under tests/e2e and are run by `npm run test:e2e`.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
