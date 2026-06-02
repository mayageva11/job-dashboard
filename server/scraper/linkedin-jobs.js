const axios = require('axios');
const db = require('../db');
const logger = require('../logger');
const { isIsraeliJob } = require('../location');
const {
  LINKEDIN_JOBS_SEARCH_URL,
  LINKEDIN_JOBS_MAX_PAGES,
  LINKEDIN_JOBS_QUERIES,
} = require('../constants');

async function fetchPage({ search_terms, location, page }) {
  const response = await axios.post(
    LINKEDIN_JOBS_SEARCH_URL,
    { search_terms, location, page: String(page) },
    {
      headers: {
        'Content-Type':    'application/json',
        'x-rapidapi-host': 'linkedin-jobs-search.p.rapidapi.com',
        'x-rapidapi-key':  process.env.RAPIDAPI_KEY,
      },
    }
  );
  return Array.isArray(response.data) ? response.data : [];
}

async function fetchQuery(query) {
  const results = [];
  for (let page = 1; page <= LINKEDIN_JOBS_MAX_PAGES; page++) {
    try {
      const batch = await fetchPage({ ...query, page });
      results.push(...batch);
      if (batch.length === 0) break;
    } catch (err) {
      const msg = `[linkedin-jobs] Failed to fetch "${query.search_terms}" page ${page}: ${err.message}`;
      logger.error(msg);
      db.insertError('linkedin-jobs', msg);
      break;
    }
  }
  return results;
}

function normalizeJob(raw) {
  return {
    title:       raw.job_title || '',
    company:     raw.company_name || '',
    location:    raw.job_location || '',
    description: '',
    url:         raw.linkedin_job_url_cleaned || raw.job_url || '',
    source:      'linkedin',
  };
}

function upsertJob(job, matchScore) {
  const existing = db.findJobByUrl(job.url)
    || db.findJobByTitleAndCompany(job.title, job.company);
  if (existing) {
    db.touchJob(existing.id);
    return false;
  }
  db.insertJob({ ...job, match_score: matchScore });
  return true;
}

async function scrapeLinkedInJobs(scoreJob) {
  if (!process.env.RAPIDAPI_KEY) {
    logger.warn('[linkedin-jobs] RAPIDAPI_KEY not set — skipping');
    return 0;
  }

  let newCount = 0;

  for (const query of LINKEDIN_JOBS_QUERIES) {
    const results = await fetchQuery(query);
    for (const raw of results) {
      const job = normalizeJob(raw);
      if (!job.url || !job.title) continue;
      if (!isIsraeliJob(job.location)) continue;
      const score = scoreJob(job);
      const isNew = upsertJob(job, score);
      if (isNew) newCount++;
    }
  }

  logger.info(`[linkedin-jobs] Scrape complete — ${newCount} new jobs inserted`);
  return newCount;
}

module.exports = { scrapeLinkedInJobs };
