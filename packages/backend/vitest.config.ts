import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://vetqueue:vetqueue@localhost:5432/vetqueue_test?schema=public',
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
      NODE_ENV: 'test',
    },
  },
});

