import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // This ensures Vitest looks in your root test folder
    include: ['tests/**/*.test.ts'], 
    // Uses your setup file for DB cleaning
    setupFiles: ['./tests/setup.ts'],
  },
});