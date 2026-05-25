import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "npm run api:dev",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: true,
      timeout: 20_000
    },
    {
      command: "npm run web:dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 20_000
    }
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ]
});
