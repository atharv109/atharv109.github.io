import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs live under tests/e2e and are run by `npm run test:e2e`.
    // Agent worktrees under .claude/ carry their own copies of both trees —
    // never collect those (a stale worktree read as 10 failing "files").
    exclude: [...configDefaults.exclude, 'tests/e2e/**', '.claude/**'],
  },
});
