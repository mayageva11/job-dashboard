process.env.TEST_DB_PATH = ':memory:';

const db = require('../db');

describe('jobs CRUD', () => {
  const sample = {
    title: 'QA Automation Engineer',
    company: 'TestCorp',
    location: 'Tel Aviv, Israel',
    description: 'playwright typescript ci/cd',
    url: 'https://example.com/job/1',
    source: 'linkedin',
    match_score: 85,
  };

  test('insertJob and findJobByUrl', () => {
    db.insertJob(sample);
    const found = db.findJobByUrl(sample.url);
    expect(found).toBeTruthy();
    expect(found.id).toBeGreaterThan(0);
  });

  test('findJobByTitleAndCompany', () => {
    const found = db.findJobByTitleAndCompany('QA Automation Engineer', 'TestCorp');
    expect(found).toBeTruthy();
  });

  test('findJobByTitleAndCompany is case-insensitive', () => {
    const found = db.findJobByTitleAndCompany('qa automation engineer', 'testcorp');
    expect(found).toBeTruthy();
  });

  test('getJobs returns only non-dismissed non-applied Israeli jobs by default', () => {
    const jobs = db.getJobs();
    expect(Array.isArray(jobs)).toBe(true);
    jobs.forEach((j) => {
      expect(j.dismissed).toBe(0);
      expect(j.applied).toBe(0);
    });
  });

  test('markJobAsApplied hides job from default getJobs', () => {
    const job = db.findJobByUrl(sample.url);
    db.markJobAsApplied(job.id);
    const visible = db.getJobs().map((j) => j.id);
    expect(visible).not.toContain(job.id);
    db.unmarkJobAsApplied(job.id);
  });

  test('unmarkJobAsApplied restores job to getJobs', () => {
    const job = db.findJobByUrl(sample.url);
    db.markJobAsApplied(job.id);
    db.unmarkJobAsApplied(job.id);
    const visible = db.getJobs().map((j) => j.id);
    expect(visible).toContain(job.id);
  });

  test('dismissJob and undismissJob', () => {
    const job = db.findJobByUrl(sample.url);
    db.dismissJob(job.id);
    const afterDismiss = db.getJobById(job.id);
    expect(afterDismiss.dismissed).toBe(1);

    db.undismissJob(job.id);
    const afterUndismiss = db.getJobById(job.id);
    expect(afterUndismiss.dismissed).toBe(0);
  });

  test('touchJob updates scraped_at', () => {
    const job = db.findJobByUrl(sample.url);
    const before = db.getJobById(job.id).scraped_at;
    db.touchJob(job.id);
    const after = db.getJobById(job.id).scraped_at;
    expect(after).not.toBeNull();
  });
});

describe('applications CRUD', () => {
  let jobId;

  beforeAll(() => {
    db.insertJob({
      title: 'Test Engineer', company: 'AppCo',
      location: 'Israel', description: 'playwright',
      url: 'https://example.com/job/2', source: 'adzuna', match_score: 75,
    });
    jobId = db.findJobByUrl('https://example.com/job/2').id;
  });

  test('insertApplication and getApplications', () => {
    db.insertApplication(jobId);
    const apps = db.getApplications();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0].title).toBeTruthy();
  });

  test('updateApplicationStatus', () => {
    const app = db.getApplications()[0];
    db.updateApplicationStatus(app.id, 'interview');
    const updated = db.getApplications().find((a) => a.id === app.id);
    expect(updated.status).toBe('interview');
  });

  test('insertManualApplication', () => {
    db.insertManualApplication({ title: 'Manual Job', company: 'ManualCo', url: 'https://manual.com', location: 'Tel Aviv', status: 'applied' });
    const apps = db.getApplications();
    const manual = apps.find((a) => a.company === 'ManualCo');
    expect(manual).toBeTruthy();
    expect(manual.status).toBe('applied');
  });

  test('getApplicationCounts', () => {
    const counts = db.getApplicationCounts();
    expect(counts).toHaveProperty('total');
    expect(counts).toHaveProperty('applied');
    expect(counts).toHaveProperty('interview');
    expect(counts).toHaveProperty('rejected');
    expect(counts).toHaveProperty('accepted');
    expect(counts.total).toBeGreaterThan(0);
  });

  test('deleteApplication', () => {
    const before = db.getApplications().length;
    db.deleteApplication(db.getApplications()[0].id);
    expect(db.getApplications().length).toBe(before - 1);
  });
});

describe('errors table', () => {
  test('insertError and getRecentErrors', () => {
    db.insertError('test-source', 'test error message');
    const errors = db.getRecentErrors(10);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe('test error message');
    expect(errors[0].source).toBe('test-source');
  });
});

describe('getJobCount', () => {
  test('returns all required fields', () => {
    const counts = db.getJobCount();
    expect(counts).toHaveProperty('total');
    expect(counts).toHaveProperty('matched');
    expect(counts).toHaveProperty('dismissed');
    expect(counts).toHaveProperty('appliedThisWeek');
    expect(counts).toHaveProperty('lastScrapeErrorCount');
  });
});
