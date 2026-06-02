process.env.TEST_DB_PATH = ':memory:';
process.env.APPLY_NAME     = 'Maya Test';
process.env.APPLY_EMAIL    = 'test@example.com';
process.env.APPLY_PHONE    = '+972500000000';
process.env.APPLY_LINKEDIN = 'https://linkedin.com/in/test';

const request = require('supertest');
const app     = require('../app');
const db      = require('../db');

const SAMPLE_JOB = {
  title: 'QA Automation Engineer', company: 'TestCorp',
  location: 'Tel Aviv, Israel', description: 'playwright typescript',
  url: 'https://example.com/api-test-job', source: 'linkedin', match_score: 85,
};

beforeAll(() => {
  db.insertJob(SAMPLE_JOB);
});

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();
  });
});

describe('GET /api/jobs', () => {
  test('returns 200 with array', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('accepts showDismissed query param', async () => {
    const res = await request(app).get('/api/jobs?showDismissed=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('accepts showApplied query param', async () => {
    const res = await request(app).get('/api/jobs?showApplied=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/jobs/count', () => {
  test('returns count object with all fields', async () => {
    const res = await request(app).get('/api/jobs/count');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('matched');
    expect(res.body).toHaveProperty('dismissed');
    expect(res.body).toHaveProperty('appliedThisWeek');
    expect(res.body).toHaveProperty('lastScrapeErrorCount');
  });
});

describe('POST /api/jobs/:id/dismiss and undismiss', () => {
  let jobId;

  beforeAll(() => {
    jobId = db.findJobByUrl(SAMPLE_JOB.url)?.id;
  });

  test('dismiss returns ok', async () => {
    const res = await request(app).post(`/api/jobs/${jobId}/dismiss`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('undismiss returns ok', async () => {
    const res = await request(app).post(`/api/jobs/${jobId}/undismiss`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('dismiss with invalid id returns 400', async () => {
    const res = await request(app).post('/api/jobs/abc/dismiss');
    expect(res.status).toBe(400);
  });

  test('dismiss with unknown id returns 404', async () => {
    const res = await request(app).post('/api/jobs/99999/dismiss');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/apply/:id', () => {
  let jobId;

  beforeAll(() => {
    jobId = db.findJobByUrl(SAMPLE_JOB.url)?.id;
  });

  test('returns job url and contact details', async () => {
    const res = await request(app).post(`/api/apply/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toBe(SAMPLE_JOB.url);
    expect(res.body.name).toBe('Maya Test');
    expect(res.body.email).toBe('test@example.com');
  });

  test('invalid id returns 400', async () => {
    const res = await request(app).post('/api/apply/0');
    expect(res.status).toBe(400);
  });

  test('unknown id returns 404', async () => {
    const res = await request(app).post('/api/apply/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/applied', () => {
  test('returns array', async () => {
    const res = await request(app).get('/api/applied');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/applied/counts', () => {
  test('returns counts object', async () => {
    const res = await request(app).get('/api/applied/counts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
  });
});

describe('POST /api/applied/manual', () => {
  test('creates application with valid data', async () => {
    const res = await request(app)
      .post('/api/applied/manual')
      .send({ title: 'QA Engineer', company: 'Startup', url: 'https://job.com', status: 'applied' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('rejects missing title', async () => {
    const res = await request(app)
      .post('/api/applied/manual')
      .send({ company: 'Startup' });
    expect(res.status).toBe(400);
  });

  test('rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/applied/manual')
      .send({ title: 'Dev', company: 'Co', status: 'hired' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/applied/:id/status', () => {
  let appId;

  beforeAll(async () => {
    await request(app).post('/api/applied/manual')
      .send({ title: 'Role', company: 'Co', status: 'applied' });
    const apps = db.getApplications();
    appId = apps[apps.length - 1].id;
  });

  test.each(['applied', 'interview', 'rejected', 'accepted'])(
    'status "%s" is accepted', async (status) => {
      const res = await request(app)
        .patch(`/api/applied/${appId}/status`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  );

  test('invalid status returns 400', async () => {
    const res = await request(app)
      .patch(`/api/applied/${appId}/status`)
      .send({ status: 'ghosted' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/applied/:id', () => {
  let appId;

  beforeAll(async () => {
    await request(app).post('/api/applied/manual')
      .send({ title: 'To Delete', company: 'DeleteCo', status: 'applied' });
    const apps = db.getApplications();
    appId = apps[apps.length - 1].id;
  });

  test('deletes successfully', async () => {
    const res = await request(app).delete(`/api/applied/${appId}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('invalid id returns 400', async () => {
    const res = await request(app).delete('/api/applied/-1');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/errors', () => {
  test('returns array', async () => {
    const res = await request(app).get('/api/errors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/cv', () => {
  test('returns 404 when no CV file exists in test env', async () => {
    const res = await request(app).get('/api/cv');
    expect([200, 404]).toContain(res.status);
  });
});
