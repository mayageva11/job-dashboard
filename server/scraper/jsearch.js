const axios = require('axios');
const db = require('../db');
const logger = require('../logger');
const { isIsraeliJob } = require('../location');
const { JSEARCH_BASE_URL, JSEARCH_MAX_PAGES, JSEARCH_QUERIES } = require('../constants');

async function fetchPage({ query, page }) {
  const response = await axios.get(JSEARCH_BASE_URL, {
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key':  process.env.RAPIDAPI_KEY,
    },
    params: { query, page, num_pages: 1 },
  });
  return response.data.data || [];
}

async function fetchQuery(query) {
  const results = [];
  for (let page = 1; page <= JSEARCH_MAX_PAGES; page++) {
    try {
      const batch = await fetchPage({ query, page });
      results.push(...batch);
      if (batch.length === 0) break;
    } catch (err) {
      const msg = `[jsearch] Failed to fetch "${query}" page ${page}: ${err.message}`;
      logger.error(msg);
      db.insertError('jsearch', msg);
      break;
    }
  }
  return results;
}

function buildLocation(raw) {
  const parts = [raw.job_city, raw.job_state, raw.job_country].filter(Boolean);
  return parts.join(', ');
}

function normalizeJob(raw) {
  return {
    title:       raw.job_title || '',
    company:     raw.employer_name || '',
    location:    raw.job_is_remote ? 'Remote' : buildLocation(raw),
    description: raw.job_description || '',
    url:         raw.job_apply_link || raw.job_url || '',
    source:      'remote',
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

async function scrapeJSearch(scoreJob) {
  if (!process.env.RAPIDAPI_KEY) {
    logger.warn('[jsearch] RAPIDAPI_KEY not set — skipping');
    return 0;
  }

  let newCount = 0;
  const allResults = [];

  for (const query of JSEARCH_QUERIES) {
    const results = await fetchQuery(query);
    allResults.push(...results);
  }

  for (const raw of allResults) {
    const job = normalizeJob(raw);
    if (!job.url) continue;
    if (!isIsraeliJob(job.location)) continue;
    const score = scoreJob(job);
    const isNew = upsertJob(job, score);
    if (isNew) newCount++;
  }

  logger.info(`[jsearch] Scrape complete — ${newCount} new jobs inserted`);
  return newCount;
}

module.exports = { scrapeJSearch };
