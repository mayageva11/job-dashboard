process.env.TEST_DB_PATH = ':memory:';
process.env.APPLY_NAME     = 'Test User';
process.env.APPLY_EMAIL    = 'test@example.com';
process.env.APPLY_PHONE    = '+972500000000';
process.env.APPLY_LINKEDIN = 'https://linkedin.com/in/test';

const request = require('supertest');
const app     = require('../app');
const db      = require('../db');

describe('Daily health checks', () => {
  test('API server is responding', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Jobs endpoint is accessible', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Job counts endpoint returns valid shape', async () => {
    const res = await request(app).get('/api/jobs/count');
    expect(res.status).toBe(200);
    const { total, matched, dismissed, appliedThisWeek } = res.body;
    expect(typeof total).toBe('number');
    expect(typeof matched).toBe('number');
    expect(typeof dismissed).toBe('number');
    expect(typeof appliedThisWeek).toBe('number');
  });

  test('Applied endpoint is accessible', async () => {
    const res = await request(app).get('/api/applied');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Applied counts endpoint is accessible', async () => {
    const res = await request(app).get('/api/applied/counts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
  });

  test('Errors endpoint is accessible', async () => {
    const res = await request(app).get('/api/errors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Matcher scores relevant jobs above threshold', () => {
    const { scoreJob } = require('../matcher');
    const relevantJobs = [
      { title: 'QA Automation Engineer', description: 'playwright typescript api testing', location: 'Tel Aviv' },
      { title: 'Test Engineer', description: 'automation e2e regression playwright', location: 'Israel' },
      { title: 'SDET', description: 'playwright api testing ci/cd typescript git', location: 'Israel' },
    ];
    relevantJobs.forEach((job) => {
      expect(scoreJob(job)).toBeGreaterThanOrEqual(70);
    });
  });

  test('Matcher caps senior/overexperienced jobs', () => {
    const { scoreJob } = require('../matcher');
    const overqualified = [
      { title: 'Senior QA Lead', description: 'playwright 8 years experience', location: 'Israel' },
      { title: 'QA Manager', description: 'manage team playwright selenium 10 years', location: 'Israel' },
    ];
    overqualified.forEach((job) => {
      expect(scoreJob(job)).toBeLessThanOrEqual(60);
    });
  });

  test('DB can write and read', () => {
    db.insertError('health-check', 'daily health check ping');
    const errors = db.getRecentErrors(1);
    expect(errors[0].source).toBe('health-check');
  });
});
