const { test, expect } = require('@playwright/test');

// 13. Rate limiting works
test('POST /api/scrape returns 429 after rate limit is reached', async ({ request }) => {
  test.setTimeout(90000);

  // Keep sending until we hit a 429 (rate limit: 5 per 15 min).
  // Use a short per-request timeout: 429 arrives instantly (rate limiter runs before the handler),
  // while real scrape work can be slow locally. Timed-out requests still increment the counter.
  const statuses = [];
  for (let i = 0; i < 10; i++) {
    let res;
    try {
      res = await request.post('http://localhost:3001/api/scrape', { timeout: 8000 });
    } catch {
      continue; // timed out — not a 429, counter was still incremented server-side
    }
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
