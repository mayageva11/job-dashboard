const { test, expect } = require('@playwright/test');

const FAKE_APPS = [
  { id: 1, title: 'QA Engineer', company: 'Acme', location: 'Tel Aviv', status: 'applied', url: 'https://example.com/1', applied_at: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Test Lead', company: 'Beta Corp', location: 'Ramat Gan', status: 'interview', url: 'https://example.com/2', applied_at: '2026-01-02T00:00:00Z' },
  { id: 3, title: 'SDET', company: 'Gamma Ltd', location: 'Herzliya', status: 'rejected', url: 'https://example.com/3', applied_at: '2026-01-03T00:00:00Z' },
];

const FAKE_COUNTS = { total: 3, applied: 1, interview: 1, rejected: 1, accepted: 0 };

async function mockAppliedApi(page, { apps = FAKE_APPS, counts = FAKE_COUNTS } = {}) {
  await page.route(
    (url) => url.pathname === '/api/applied' || url.pathname.startsWith('/api/applied/'),
    (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.endsWith('/counts')) return route.fulfill({ json: counts });
      return route.fulfill({ json: apps });
    }
  );
}

// 10. Applied page loads
test('applied page shows table headers', async ({ page }) => {
  await mockAppliedApi(page);
  await page.goto('/applied');

  for (const header of ['Role', 'Company', 'Location', 'Date', 'Status']) {
    await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
  }
});

// 11. Empty state on applied page
test('applied empty state is shown when no applications', async ({ page }) => {
  await mockAppliedApi(page, {
    apps: [],
    counts: { total: 0, applied: 0, interview: 0, rejected: 0, accepted: 0 },
  });
  await page.goto('/applied');

  await expect(page.getByText('Nothing here yet')).toBeVisible();
});

// 12. Status chips render correct colors
test('status chips are color coded', async ({ page }) => {
  await mockAppliedApi(page);
  await page.goto('/applied');

  const statusColors = [
    { status: 'applied',   label: 'Applied',   rgb: 'rgb(124, 58, 237)' },
    { status: 'interview', label: 'Interview', rgb: 'rgb(234, 88, 12)' },
    { status: 'rejected',  label: 'Rejected',  rgb: 'rgb(220, 38, 38)' },
  ];

  for (const { label, rgb } of statusColors) {
    const chip = page.locator('tbody tr').filter({ hasText: label }).locator('button').filter({ hasText: label });
    await expect(chip).toHaveCSS('color', rgb);
  }
});
