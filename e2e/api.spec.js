const { test, expect } = require('@playwright/test');

// 13. Rate limiting works
test('POST /api/scrape returns 429 after rate limit is reached', async ({ request }) => {
  test.setTimeout(90000);

  // Keep sending until we hit a 429 (rate limit: 5 per 15 min).
  // Don't assume a clean window — previous runs in the same session may have consumed slots.
  const statuses = [];
  for (let i = 0; i < 10; i++) {
    const res = await request.post('http://localhost:3001/api/scrape');
    statuses.push(res.status());
    if (res.status() === 429) break;
  }

  // Eventually a 429 must appear
  expect(statuses).toContain(429);
  // Once a 429 is returned, it must be the last response (rate limiter is consistent)
  expect(statuses[statuses.length - 1]).toBe(429);
  // All responses before the first 429 must not be rate-limited
  const before429 = statuses.slice(0, statuses.indexOf(429));
  expect(before429.every(s => s !== 429)).toBe(true);
});

// 14. CV endpoint streams file
test('GET /api/cv returns PDF with correct headers', async ({ request }) => {
  const res = await request.get('http://localhost:3001/api/cv');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  expect(res.headers()['content-disposition']).toContain('attachment');
});

// 15. Direct asset access is blocked
test('GET /assets/cv.pdf returns 404', async ({ request }) => {
  const res = await request.get('http://localhost:3001/assets/cv.pdf');
  expect(res.status()).toBe(404);
});
