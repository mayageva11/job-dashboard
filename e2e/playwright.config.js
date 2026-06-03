const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const root = path.join(__dirname, '..');

module.exports = defineConfig({
  testDir: '.',
  outputDir: path.join(__dirname, 'screenshots'),
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: path.join(root, 'playwright-report'), open: 'never' }], ['list']]
    : [['html', { outputFolder: path.join(root, 'playwright-report'), open: 'on-failure' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: [
    {
      command: 'npm run server',
      port: 3001,
      cwd: root,
      reuseExistingServer: !process.env.CI,
      timeout: 20000,
    },
    {
      command: 'npm --prefix client run dev',
      port: 5173,
      cwd: root,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
