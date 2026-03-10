import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run test files sequentially. Each file gets its own in-memory SQLite DB instance
    // (db.ts detects Vitest via process.env.VITEST), but sequential execution keeps output
    // readable and avoids any contention on shared resources.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      exclude: ['src/services/anthropic.ts'],
    },
  },
})
