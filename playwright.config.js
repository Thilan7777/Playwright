// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 300000, // 5 minutes timeout for deep pagination (up to 1000 pages)
  use: {
    headless: false,
    viewport: null, // Use full browser window size instead of fixed viewport
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--start-maximized'] // Launch browser maximized
    }
    // actionTimeout removed to allow infinite waits for user input
  },
});
