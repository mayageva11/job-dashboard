const axios = require('axios');
const db = require('../db');
const logger = require('../logger');
const { isIsraeliJob } = require('../location');
const {
  ADZUNA_BASE_URL,
  ADZUNA_PAGE_SIZE,
  ADZUNA_MAX_PAGES,
  ADZUNA_QUERIES,
} = require('../constants');

async function fetchPage({ what, where, page }) {
  const response = await axios.get(`${ADZUNA_BASE_URL}/${page}`, {
    params: {
      app_id:           process.env.ADZUNA_APP_ID,
      app_key:          process.env.ADZUNA_APP_KEY,
      what,
      where,
      results_per_page: ADZUNA_PAGE_SIZE,
      'content-type':   'application/json',
    },
  });
  return response.data.results || [];
}

async function fetchQuery(query) {
  const results = [];
  for (let page = 1; page <= ADZUNA_MAX_PAGES; page++) {
    try {
      const batch = await fetchPage({ ...query, page });
      results.push(...batch);
      if (batch.length < ADZUNA_PAGE_SIZE) break;
    } catch (err) {
      const msg = `[adzuna] Failed to fetch "${query.what}" page ${page}: ${err.message}`;
      logger.error(msg);
      db.insertError('adzuna', msg);
      break;
    }
  }
  return results;
}

function normalizeJob(raw) {
  return {
    title:       raw.title || '',
    company:     raw.company?.display_name || '',
    location:    raw.location?.display_name || '',
    description: raw.description || '',
    url:         raw.redirect_url || '',
    source:      'adzuna',
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

async function scrapeAdzuna(scoreJob) {
  let newCount = 0;
  const allResults = [];

  for (const query of ADZUNA_QUERIES) {
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

  logger.info(`[adzuna] Scrape complete — ${newCount} new jobs inserted`);
  return newCount;
}

module.exports = { scrapeAdzuna };
