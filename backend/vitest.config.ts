import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run test files sequentially to prevent concurrent writes to the shared SQLite database.
    // Route tests use the real on-disk db via the singleton in db.ts — parallel file execution
    // causes "database is locked" errors.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      exclude: ['src/services/anthropic.ts'],
    },
  },
});
