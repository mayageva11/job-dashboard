const MATCH_THRESHOLD = 70;
const SCORE_CAP_NEGATIVE = 60;
const TITLE_BOOST = 10;
const EXPERIENCE_BOOST = 8;
const SCORE_DENOMINATOR = 11;
const MAX_EXPERIENCE_YEARS = 5;
const ADZUNA_PAGE_SIZE = 50;
const ADZUNA_MAX_PAGES = 3;
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search';
const ERRORS_LIMIT = 10;

const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';
const JSEARCH_MAX_PAGES = 2;

const JSEARCH_QUERIES = [
  'QA automation engineer remote',
  'automation engineer remote',
  'test engineer remote',
  'SDET remote',
  'software engineer entry level remote',
];

const LINKEDIN_JOBS_SEARCH_URL = 'https://linkedin-jobs-search.p.rapidapi.com/';
const LINKEDIN_JOBS_MAX_PAGES = 3;

const LINKEDIN_JOBS_QUERIES = [
  { search_terms: 'QA automation',       location: 'Israel'    },
  { search_terms: 'automation engineer', location: 'Israel'    },
  { search_terms: 'test engineer',       location: 'Israel'    },
  { search_terms: 'QA engineer',         location: 'Tel Aviv'  },
  { search_terms: 'software engineer',   location: 'Tel Aviv'  },
  { search_terms: 'SDET',               location: 'Israel'    },
];

const LINKEDIN_RSS_FEEDS = [
  'https://www.linkedin.com/jobs/search/?keywords=QA+automation&location=Israel&f_WT=2&format=rss',
  'https://www.linkedin.com/jobs/search/?keywords=automation+engineer&location=Israel&format=rss',
  'https://www.linkedin.com/jobs/search/?keywords=test+engineer&location=Israel&format=rss',
  'https://www.linkedin.com/jobs/search/?keywords=QA+engineer&location=Tel+Aviv&format=rss',
  'https://www.linkedin.com/jobs/search/?keywords=software+engineer&location=Tel+Aviv&f_EXP=1%2C2&format=rss',
];

const ADZUNA_QUERIES = [
  { what: 'QA automation remote',       where: '' },
  { what: 'automation engineer remote', where: '' },
  { what: 'test engineer remote',       where: '' },
  { what: 'SDET remote',               where: '' },
];

const ISRAEL_LOCATION_KEYWORDS = [
  'israel',
  'tel aviv',
  'petah tikva',
  'haifa',
  'jerusalem',
  'rishon',
  'herzliya',
  'ramat gan',
  'beer sheva',
  'netanya',
  "ra'anana",
  'ranaana',
  'kfar saba',
  'rehovot',
  'holon',
  'modiin',
  'ashdod',
  'givatayim',
  'yaffo',
  'jaffa',
  'merkaz',
  'central district',
];

const REQUIRED_ENV = [
  'ADZUNA_APP_ID',
  'ADZUNA_APP_KEY',
  'APPLY_NAME',
  'APPLY_EMAIL',
  'APPLY_PHONE',
  'APPLY_LINKEDIN',
  'NOTIFY_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

module.exports = {
  MATCH_THRESHOLD,
  ISRAEL_LOCATION_KEYWORDS,
  LINKEDIN_JOBS_SEARCH_URL,
  LINKEDIN_JOBS_MAX_PAGES,
  LINKEDIN_JOBS_QUERIES,
  LINKEDIN_RSS_FEEDS,
  SCORE_CAP_NEGATIVE,
  TITLE_BOOST,
  EXPERIENCE_BOOST,
  SCORE_DENOMINATOR,
  MAX_EXPERIENCE_YEARS,
  ADZUNA_PAGE_SIZE,
  ADZUNA_MAX_PAGES,
  ADZUNA_BASE_URL,
  ADZUNA_QUERIES,
  JSEARCH_BASE_URL,
  JSEARCH_MAX_PAGES,
  JSEARCH_QUERIES,
  ERRORS_LIMIT,
  REQUIRED_ENV,
};
