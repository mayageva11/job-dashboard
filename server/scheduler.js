const cron = require('node-cron');
const logger = require('./logger');
const { scrapeAdzuna } = require('./scraper/adzuna');
const { scrapeJSearch } = require('./scraper/jsearch');
const { scrapeLinkedInRSS } = require('./scraper/linkedin-rss');
const { scrapeLinkedInJobs } = require('./scraper/linkedin-jobs');
const { scoreJob } = require('./matcher');
const { sendDigest } = require('./notifier');
const db = require('./db');
const { MATCH_THRESHOLD } = require('./constants');

async function runScrape() {
  logger.info('[scheduler] Starting daily scrape');
  try {
    const [adzunaCount, jsearchCount, linkedinRssCount, linkedinJobsCount] = await Promise.all([
      scrapeAdzuna(scoreJob),
      scrapeJSearch(scoreJob),
      scrapeLinkedInRSS(scoreJob),
      scrapeLinkedInJobs(scoreJob),
    ]);
    const newCount = adzunaCount + jsearchCount + linkedinRssCount + linkedinJobsCount;
    if (newCount > 0) {
      const newMatches = db.getJobs(false).filter((j) => j.match_score >= MATCH_THRESHOLD);
      await sendDigest(newMatches.slice(0, newCount));
    }
    logger.info(`[scheduler] Scrape finished — ${newCount} new jobs (adzuna: ${adzunaCount}, jsearch: ${jsearchCount}, linkedin-rss: ${linkedinRssCount}, linkedin-jobs: ${linkedinJobsCount})`);
  } catch (err) {
    const msg = `[scheduler] Scrape failed: ${err.message}`;
    logger.error(msg);
    db.insertError('scheduler', msg);
  }
}

function startScheduler() {
  cron.schedule('0 8 * * *', runScrape);
  logger.info('[scheduler] Daily scrape scheduled at 08:00');
}

module.exports = { startScheduler, runScrape };
