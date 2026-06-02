const { scoreJob, isMatch } = require('../matcher');

function job(title, description = '') {
  return { title, description, location: 'Tel Aviv, Israel' };
}

describe('scoreJob — relevant QA/automation roles', () => {
  test('QA automation title with description scores ≥70', () => {
    expect(scoreJob(job(
      'QA Automation Engineer',
      'playwright typescript api testing ci/cd git agile jira'
    ))).toBeGreaterThanOrEqual(70);
  });

  test('Test engineer title with automation description scores ≥70', () => {
    expect(scoreJob(job(
      'Test Engineer',
      'automation testing playwright regression testing rest api'
    ))).toBeGreaterThanOrEqual(70);
  });

  test('Entry-level job with 1-3 years scores ≥70', () => {
    expect(scoreJob(job(
      'Junior QA Engineer',
      'entry level 1-3 years experience playwright selenium jira git'
    ))).toBeGreaterThanOrEqual(70);
  });

  test('Job with 2 years experience gets experience boost', () => {
    const base = 'playwright typescript api testing ci/cd jira git automation testing agile';
    const withYears    = scoreJob(job('QA Automation Engineer', base + ' 2 years experience'));
    const withoutYears = scoreJob(job('QA Automation Engineer', base));
    expect(withYears).toBeGreaterThanOrEqual(withoutYears);
  });

  test('4 years experience is NOT filtered out', () => {
    expect(scoreJob(job(
      'Automation Engineer',
      'playwright typescript api testing 4 years experience ci/cd'
    ))).toBeGreaterThanOrEqual(70);
  });
});

describe('scoreJob — title-only (no description)', () => {
  test('QA Automation Engineer title alone scores ≥70', () => {
    expect(scoreJob(job('QA Automation Engineer'))).toBeGreaterThanOrEqual(70);
  });

  test('Test Engineer title alone scores ≥70', () => {
    expect(scoreJob(job('Test Engineer'))).toBeGreaterThanOrEqual(70);
  });

  test('QA Software Tester title scores ≥70', () => {
    expect(scoreJob(job('QA Software Tester'))).toBeGreaterThanOrEqual(70);
  });

  test('Unrelated title scores 0 when no description', () => {
    expect(scoreJob(job('Java Backend Developer'))).toBe(0);
  });
});

describe('scoreJob — senior/lead/over-experience filtering', () => {
  test('Senior in title caps score at 60', () => {
    expect(scoreJob(job(
      'Senior QA Automation Engineer',
      'playwright typescript api testing 5+ years'
    ))).toBeLessThanOrEqual(60);
  });

  test('Lead in description caps score at 60', () => {
    expect(scoreJob(job(
      'QA Engineer',
      'lead qa automation playwright 8 years experience'
    ))).toBeLessThanOrEqual(60);
  });

  test('5 years required caps score at 60', () => {
    expect(scoreJob(job(
      'QA Automation Engineer',
      'playwright typescript 5 years experience required'
    ))).toBeLessThanOrEqual(60);
  });

  test('7 years required caps score at 60', () => {
    expect(scoreJob(job(
      'Automation Engineer',
      'selenium python 7 years minimum'
    ))).toBeLessThanOrEqual(60);
  });
});

describe('scoreJob — year boundary matching', () => {
  test('13 years does NOT match 3 years filter', () => {
    const score13 = scoreJob(job('QA Automation Engineer', 'playwright typescript 13 years'));
    const score3  = scoreJob(job('QA Automation Engineer', 'playwright typescript 3 years'));
    expect(score13).toBeLessThanOrEqual(60);
    expect(score3).toBeGreaterThanOrEqual(70);
  });

  test('1-4 year range jobs all show on dashboard', () => {
    [1, 2, 3, 4].forEach((yrs) => {
      const s = scoreJob(job(
        'QA Automation Engineer',
        `playwright typescript ${yrs} years experience api testing`
      ));
      expect(s).toBeGreaterThanOrEqual(70);
    });
  });
});

describe('isMatch helper', () => {
  test('returns true for matching job', () => {
    expect(isMatch(job('QA Automation Engineer', 'playwright typescript ci/cd api testing'))).toBe(true);
  });

  test('returns false for senior job', () => {
    expect(isMatch(job('Senior QA Lead', 'playwright 10 years experience'))).toBe(false);
  });
});
