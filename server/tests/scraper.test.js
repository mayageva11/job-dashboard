process.env.TEST_DB_PATH = ':memory:';

jest.mock('axios');

const axios = require('axios');

describe('Adzuna scraper', () => {
  let scrapeAdzuna, scoreJob;

  beforeAll(() => {
    process.env.ADZUNA_APP_ID  = 'test-id';
    process.env.ADZUNA_APP_KEY = 'test-key';
    scrapeAdzuna = require('../scraper/adzuna').scrapeAdzuna;
    scoreJob     = require('../matcher').scoreJob;
  });

  beforeEach(() => jest.clearAllMocks());

  test('inserts Israeli jobs returned by the API', async () => {
    axios.get.mockResolvedValue({ data: { results: [{
      title:        'QA Automation Engineer',
      company:      { display_name: 'TestCorp' },
      location:     { display_name: 'Tel Aviv, Israel' },
      description:  'playwright typescript ci/cd api testing',
      redirect_url: `https://adzuna.com/job/${Date.now()}`,
    }] } });

    const count = await scrapeAdzuna(scoreJob);
    expect(count).toBeGreaterThan(0);
  });

  test('skips jobs with no URL', async () => {
    axios.get.mockResolvedValue({ data: { results: [{
      title: 'Dev', company: { display_name: 'Co' },
      location: { display_name: 'Israel' }, description: '',
      redirect_url: '',
    }] } });

    const count = await scrapeAdzuna(scoreJob);
    expect(count).toBe(0);
  });

  test('skips non-Israeli jobs', async () => {
    axios.get.mockResolvedValue({ data: { results: [{
      title: 'Dev', company: { display_name: 'UKCo' },
      location: { display_name: 'London, UK' }, description: 'playwright',
      redirect_url: `https://adzuna.com/job/uk-${Date.now()}`,
    }] } });

    const count = await scrapeAdzuna(scoreJob);
    expect(count).toBe(0);
  });

  test('returns 0 and logs error on API failure', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const count = await scrapeAdzuna(scoreJob);
    expect(count).toBe(0);
  });

  test('stops pagination early when page returns fewer than 50 results', async () => {
    axios.get.mockResolvedValue({ data: { results: Array(10).fill(null).map((_, i) => ({
      title: 'QA Engineer', company: { display_name: `Co${i}` },
      location: { display_name: 'Israel' }, description: 'playwright',
      redirect_url: `https://adzuna.com/job/page-${Date.now()}-${i}`,
    })) } });

    await scrapeAdzuna(scoreJob);
    const { ADZUNA_QUERIES } = require('../constants');
    expect(axios.get.mock.calls.length).toBe(ADZUNA_QUERIES.length);
  });
});

describe('LinkedIn Jobs scraper', () => {
  let scrapeLinkedInJobs, scoreJob;

  beforeAll(() => {
    scrapeLinkedInJobs = require('../scraper/linkedin-jobs').scrapeLinkedInJobs;
    scoreJob           = require('../matcher').scoreJob;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAPIDAPI_KEY = 'test-rapidapi-key';
  });

  test('calls API with correct RapidAPI headers', async () => {
    axios.post.mockResolvedValue({ data: [] });
    await scrapeLinkedInJobs(scoreJob);
    expect(axios.post).toHaveBeenCalled();
    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers['x-rapidapi-key']).toBe('test-rapidapi-key');
    expect(headers['x-rapidapi-host']).toBe('linkedin-jobs-search.p.rapidapi.com');
  });

  test('inserts Israeli LinkedIn jobs', async () => {
    axios.post.mockResolvedValue({ data: [{
      job_title:                'Automation Engineer',
      company_name:             `IsraeliCo${Date.now()}`,
      job_location:             'Tel Aviv, Israel',
      linkedin_job_url_cleaned: `https://linkedin.com/jobs/view/${Date.now()}`,
    }] });

    const count = await scrapeLinkedInJobs(scoreJob);
    expect(count).toBeGreaterThan(0);
  });

  test('skips non-Israeli jobs', async () => {
    axios.post.mockResolvedValue({ data: [{
      job_title: 'Dev', company_name: 'USCo',
      job_location: 'New York, NY',
      linkedin_job_url_cleaned: `https://linkedin.com/jobs/view/ny-${Date.now()}`,
    }] });

    const count = await scrapeLinkedInJobs(scoreJob);
    expect(count).toBe(0);
  });

  test('skips when RAPIDAPI_KEY is not set', async () => {
    delete process.env.RAPIDAPI_KEY;
    const count = await scrapeLinkedInJobs(scoreJob);
    expect(count).toBe(0);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
