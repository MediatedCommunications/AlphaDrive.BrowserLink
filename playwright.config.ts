import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: { actionTimeout: 3000 },
  testDir: './test/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 15_000,
  expect: { timeout: 3_000 },
  outputDir: './output/browser-results',
  reporter: [['list']],
});
