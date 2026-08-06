import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// The environment pre-installs Chromium under PLAYWRIGHT_BROWSERS_PATH. When the
// pinned Playwright version's expected build differs, point at the installed
// full Chromium binary instead of downloading.
const CANDIDATE_CHROME = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
];
const executablePath = CANDIDATE_CHROME.find((p) => existsSync(p));

/**
 * Playwright e2e config. Boots the production build and runs a smoke journey
 * through the demo. Chromium is provided by the environment
 * (PLAYWRIGHT_BROWSERS_PATH); we do not download browsers.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    // Uses the existing production build (run `pnpm --filter @aion/web build` first).
    command: 'pnpm --filter @aion/web start',
    url: 'http://localhost:3000/dashboard',
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: '../..',
  },
});
