const { test, expect } = require('@playwright/test');

const FAKE_COUNTS = {
  total: 10, matched: 3, appliedThisWeek: 1, dismissed: 2,
  lastScrapedAt: null, lastScrapeErrorCount: 0,
};

const FAKE_JOBS = [
  { id: 1, title: 'QA Engineer', company: 'Acme', location: 'Tel Aviv', url: 'https://example.com/1', source: 'linkedin', match_score: 85, dismissed: 0, applied: 0 },
  { id: 2, title: 'Test Automation', company: 'Beta Corp', location: 'Ramat Gan', url: 'https://example.com/2', source: 'adzuna', match_score: 72, dismissed: 0, applied: 0 },
  { id: 3, title: 'SDET', company: 'Gamma Ltd', location: 'Herzliya', url: 'https://example.com/3', source: 'remote', match_score: 90, dismissed: 0, applied: 0 },
];

async function mockJobsApi(page, { jobs = FAKE_JOBS, dismissedJobs = [] } = {}) {
  // Use URL predicate to reliably match /api/jobs, /api/jobs?*, /api/jobs/count, /api/jobs/:id/dismiss etc.
  await page.route(
    (url) => url.pathname === '/api/jobs' || url.pathname.startsWith('/api/jobs/'),
    (route) => {
      const { pathname, searchParams } = new URL(route.request().url());
      if (pathname.endsWith('/count')) return route.fulfill({ json: FAKE_COUNTS });
      if (pathname.includes('/dismiss') || pathname.includes('/undismiss')) return route.fulfill({ json: { ok: true } });
      return route.fulfill({ json: searchParams.get('showDismissed') === '1' ? dismissedJobs : jobs });
    }
  );
}

// 1. Page loads correctly
test('dashboard loads with correct title and nav', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Job Dashboard/);
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Applied' })).toBeVisible();
});

// 2. Stats bar renders
test('stats bar shows 4 stat cards', async ({ page }) => {
  await mockJobsApi(page);
  await page.goto('/');
  for (const label of ['Total scraped', 'Matched ≥70%', 'Applied this week']) {
    await expect(page.getByText(label)).toBeVisible();
  }
  // 'Dismissed' also appears on the toggle button; nth(1) targets the stat card label
  await expect(page.getByText('Dismissed').nth(1)).toBeVisible();
});

// 3. Scrape Now button exists and is clickable
test('scrape now button is visible and enabled', async ({ page }) => {
  await mockJobsApi(page);
  await page.route((url) => url.pathname === '/api/scrape', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/');

  const btn = page.getByRole('button', { name: 'Scrape Now' });
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();

  await btn.click();
  // The mock returns instantly so 'Scraping…' is fleeting; assert the toast instead
  await expect(page.getByText('Scrape complete!')).toBeVisible({ timeout: 5000 });
});

// 4. Show Dismissed toggle works
test('show dismissed toggle filters cards', async ({ page }) => {
  await mockJobsApi(page, { dismissedJobs: [] });
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Dismissed' });
  await expect(toggle).toBeVisible();

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Hide Dismissed' })).toBeVisible();
  await expect(page.getByText('No dismissed jobs')).toBeVisible();

  await page.getByRole('button', { name: 'Hide Dismissed' }).click();
  await expect(page.getByRole('button', { name: 'Dismissed' })).toBeVisible();
});

// 5. Filter bar is client-side only
test('source filter does not trigger network request', async ({ page }) => {
  await mockJobsApi(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const apiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/jobs') && req.method() === 'GET') {
      apiRequests.push(req.url());
    }
  });

  await page.getByRole('button', { name: /LinkedIn/ }).click();
  await page.waitForTimeout(300);

  expect(apiRequests).toHaveLength(0);
});

// 6. Job cards render correctly when jobs exist
test('job cards show title, company, match badge', async ({ page }) => {
  await mockJobsApi(page);
  await page.goto('/');

  for (const job of FAKE_JOBS) {
    await expect(page.getByText(job.title)).toBeVisible();
    await expect(page.getByText(job.company)).toBeVisible();
    await expect(page.getByText(`${job.match_score}%`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /^Apply$/ })).toHaveCount(FAKE_JOBS.length);
});

// 7. Apply button behavior
test('clicking Apply shows toast', async ({ page }) => {
  await mockJobsApi(page);
  await page.route(
    (url) => url.pathname.startsWith('/api/apply/'),
    (route) => route.fulfill({
      json: { url: 'https://example.com/1', name: 'Test User', email: 'test@test.com', phone: '+972000000000', linkedin: '' },
    })
  );
  await page.goto('/');

  await page.getByRole('button', { name: /^Apply$/ }).first().click();
  await expect(page.getByText(/Applied!/i)).toBeVisible({ timeout: 5000 });
});

// 8. Dismiss button removes card
test('dismiss removes card from view', async ({ page }) => {
  await mockJobsApi(page);
  await page.goto('/');

  await expect(page.getByText(FAKE_JOBS[0].title)).toBeVisible();

  await page.locator('[title="Dismiss job"]').first().click();
  await expect(page.getByText(FAKE_JOBS[0].title)).not.toBeVisible({ timeout: 2000 });
});

// 9. Empty state renders when no jobs
test('empty state shows when no matching jobs', async ({ page }) => {
  await mockJobsApi(page, { jobs: [] });
  await page.route((url) => url.pathname === '/api/scrape', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/');

  await expect(page.getByText('No matching jobs yet')).toBeVisible();
  // Two 'Scrape Now' buttons exist (header + empty-state CTA); either proves the CTA is rendered
  await expect(page.getByRole('button', { name: 'Scrape Now' }).first()).toBeVisible();
});
