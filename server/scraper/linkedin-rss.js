const Parser = require('rss-parser');
const db = require('../db');
const logger = require('../logger');
const { LINKEDIN_RSS_FEEDS } = require('../constants');

const parser = new Parser({ timeout: 10000 });

function parseTitle(rawTitle) {
  if (!rawTitle) return { title: '', company: '' };
  const atIdx = rawTitle.lastIndexOf(' at ');
  if (atIdx !== -1) {
    return {
      title:   rawTitle.slice(0, atIdx).trim(),
      company: rawTitle.slice(atIdx + 4).trim(),
    };
  }
  const dashIdx = rawTitle.indexOf(' - ');
  if (dashIdx !== -1) {
    return {
      title:   rawTitle.slice(0, dashIdx).trim(),
      company: rawTitle.slice(dashIdx + 3).trim(),
    };
  }
  return { title: rawTitle.trim(), company: '' };
}

function normalizeJob(item) {
  const { title, company } = parseTitle(item.title);
  return {
    title,
    company,
    location:    item.location || '',
    description: item.contentSnippet || item.content || item.summary || '',
    url:         item.link || item.guid || '',
    source:      'linkedin',
  };
}

async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (err) {
    logger.warn(`[linkedin-rss] Feed unavailable (${url.slice(0, 60)}…): ${err.message}`);
    return [];
  }
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

async function scrapeLinkedInRSS(scoreJob) {
  let newCount = 0;

  for (const url of LINKEDIN_RSS_FEEDS) {
    const items = await fetchFeed(url);
    for (const item of items) {
      const job = normalizeJob(item);
      if (!job.url || !job.title) continue;
      const score = scoreJob(job);
      const isNew = upsertJob(job, score);
      if (isNew) newCount++;
    }
  }

  logger.info(`[linkedin-rss] Scrape complete — ${newCount} new jobs inserted`);
  return newCount;
}

module.exports = { scrapeLinkedInRSS };
