process.env.TEST_DB_PATH  = ':memory:';
process.env.APPLY_NAME    = 'Maya Test';
process.env.APPLY_EMAIL   = 'test@example.com';
process.env.APPLY_PHONE   = '+972500000000';
process.env.APPLY_LINKEDIN= 'https://linkedin.com/in/test';

const request = require('supertest');
const app     = require('../app');
const db      = require('../db');

function seedJob(overrides = {}) {
  const url = overrides.url || `https://example.com/job/${Date.now()}-${Math.random()}`;
  const job = {
    title: 'QA Automation Engineer', company: 'Seed Corp',
    location: 'Tel Aviv, Israel', description: 'playwright typescript',
    source: 'linkedin', match_score: 85,
    ...overrides,
    url,
  };
  db.insertJob(job);
  const row = db.findJobByUrl(url);
  return { ...row, url };
}

describe('Full apply flow', () => {
  test('job disappears from dashboard after applying', async () => {
    const job = seedJob();

    const before = await request(app).get('/api/jobs');
    const beforeIds = before.body.map((j) => j.id);
    expect(beforeIds).toContain(job.id);

    await request(app).post(`/api/apply/${job.id}`);

    const after = await request(app).get('/api/jobs');
    const afterIds = after.body.map((j) => j.id);
    expect(afterIds).not.toContain(job.id);
  });

  test('applied job appears in /api/applied', async () => {
    const job = seedJob({ url: `https://example.com/applied-flow-${Date.now()}` });
    await request(app).post(`/api/apply/${job.id}`);

    const res = await request(app).get('/api/applied');
    const found = res.body.find((a) => a.job_id === job.id || a.url === job.url);
    expect(found).toBeTruthy();
  });

  test('applied job visible with showApplied=1', async () => {
    const job = seedJob({ url: `https://example.com/show-applied-${Date.now()}` });
    await request(app).post(`/api/apply/${job.id}`);

    const hidden = await request(app).get('/api/jobs');
    expect(hidden.body.map((j) => j.id)).not.toContain(job.id);

    const shown = await request(app).get('/api/jobs?showApplied=1');
    expect(shown.body.map((j) => j.id)).toContain(job.id);
  });

  test('job count reflects appliedJobs field', async () => {
    const countBefore = (await request(app).get('/api/jobs/count')).body.appliedJobs;
    const job = seedJob({ url: `https://example.com/count-test-${Date.now()}` });
    await request(app).post(`/api/apply/${job.id}`);
    const countAfter = (await request(app).get('/api/jobs/count')).body.appliedJobs;
    expect(countAfter).toBe(countBefore + 1);
  });
});

describe('Full dismiss flow', () => {
  test('dismissed job hidden by default, visible with showDismissed=1', async () => {
    const job = seedJob({ url: `https://example.com/dismiss-${Date.now()}` });

    await request(app).post(`/api/jobs/${job.id}/dismiss`);

    const hidden = (await request(app).get('/api/jobs')).body;
    expect(hidden.map((j) => j.id)).not.toContain(job.id);

    const shown = (await request(app).get('/api/jobs?showDismissed=1')).body;
    expect(shown.map((j) => j.id)).toContain(job.id);
  });

  test('undismiss restores job to dashboard', async () => {
    const job = seedJob({ url: `https://example.com/undismiss-${Date.now()}` });
    await request(app).post(`/api/jobs/${job.id}/dismiss`);
    await request(app).post(`/api/jobs/${job.id}/undismiss`);

    const res = await request(app).get('/api/jobs');
    expect(res.body.map((j) => j.id)).toContain(job.id);
  });
});

describe('Full application status flow', () => {
  let appId;

  beforeAll(async () => {
    await request(app).post('/api/applied/manual').send({
      title: 'Status Flow Job', company: 'StatusCo', status: 'applied',
    });
    const apps = (await request(app).get('/api/applied')).body;
    appId = apps.find((a) => a.company === 'StatusCo')?.id;
  });

  const transitions = [
    ['applied',   'interview'],
    ['interview', 'rejected'],
    ['rejected',  'accepted'],
    ['accepted',  'applied'],
  ];

  test.each(transitions)('status transitions %s → %s', async (from, to) => {
    await request(app).patch(`/api/applied/${appId}/status`).send({ status: from });
    await request(app).patch(`/api/applied/${appId}/status`).send({ status: to });
    const apps = (await request(app).get('/api/applied')).body;
    const app_ = apps.find((a) => a.id === appId);
    expect(app_.status).toBe(to);
  });
});

describe('Manual application', () => {
  test('creates and appears in applied list', async () => {
    await request(app).post('/api/applied/manual').send({
      title: 'Manual Role', company: 'ManualCorp',
      url: 'https://manual.example.com', location: 'Tel Aviv',
      status: 'interview',
    });
    const apps = (await request(app).get('/api/applied')).body;
    const found = apps.find((a) => a.company === 'ManualCorp');
    expect(found).toBeTruthy();
    expect(found.status).toBe('interview');
    expect(found.location).toBe('Tel Aviv');
  });

  test('can be deleted and disappears from list', async () => {
    await request(app).post('/api/applied/manual').send({
      title: 'To Delete', company: 'DeleteMe', status: 'applied',
    });
    const before = (await request(app).get('/api/applied')).body;
    const target = before.find((a) => a.company === 'DeleteMe');
    expect(target).toBeTruthy();

    await request(app).delete(`/api/applied/${target.id}`);
    const after = (await request(app).get('/api/applied')).body;
    expect(after.find((a) => a.id === target.id)).toBeUndefined();
  });
});
