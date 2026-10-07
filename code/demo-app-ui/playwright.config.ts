import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Keeps browser journeys separate from colocated Vitest component tests.
  testDir: './tests/e2e',
  // The E2E flow changes shared local database state, so run one at a time.
  fullyParallel: false,
  // Retry once to collect trace evidence for intermittent failures.
  retries: 1,
  // Show concise terminal output and retain a browsable HTML report.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // All relative page URLs target the locally running Docker UI.
    baseURL: 'http://localhost:3001',
    // Capture diagnostic artifacts only when they are useful for a failure.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // One representative desktop browser keeps the assessment time-boxed.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
