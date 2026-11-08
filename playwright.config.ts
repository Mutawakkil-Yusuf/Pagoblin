import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    launchOptions: { args: ["--no-proxy-server"] },
  },
  webServer: {
    command: "npx next start -p 3100",
    port: 3100,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  reportSlowTests: null,
});
