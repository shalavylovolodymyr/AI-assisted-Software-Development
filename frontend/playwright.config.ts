import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const localBrowsers = resolve(import.meta.dirname, "../.local/browsers");
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localBrowsers))
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5179",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "PYTHONPATH=../backend/src ../.venv/bin/python ../scripts/e2e-api.py",
      url: "http://127.0.0.1:8001/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "API_PROXY=http://127.0.0.1:8001 npm run preview -- --port 5179",
      url: "http://127.0.0.1:5179",
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
