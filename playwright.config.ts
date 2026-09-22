import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 5173",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
  testDir: "./tests",
  fullyParallel: true,
  workers: 4,
  timeout: 60000,
  reporter: [["list"], ["json", { outputFile: "evidence/e2e-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
