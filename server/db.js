const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.TEST_DB_PATH || path.join(__dirname, 'jobs.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT,
    company     TEXT,
    location    TEXT,
    description TEXT,
    url         TEXT UNIQUE,
    source      TEXT,
    match_score REAL,
    dismissed   INTEGER DEFAULT 0,
    applied     INTEGER DEFAULT 0,
    scraped_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id     INTEGER REFERENCES jobs(id),
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status     TEXT DEFAULT 'applied',
    title      TEXT,
    company    TEXT,
    url        TEXT,
    location   TEXT
  );

  CREATE TABLE IF NOT EXISTS errors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    source     TEXT,
    message    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate existing tables if columns are missing
['title', 'company', 'url', 'location'].forEach((col) => {
  try { db.exec(`ALTER TABLE applications ADD COLUMN ${col} TEXT`); } catch (_) {}
});
try { db.exec(`ALTER TABLE jobs ADD COLUMN applied INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`UPDATE applications SET status = 'applied' WHERE status = 'manual'`); } catch (_) {}

function findJobByUrl(url) {
  return db.prepare('SELECT id FROM jobs WHERE url = ?').get(url);
}

function findJobByTitleAndCompany(title, company) {
  return db.prepare(
    'SELECT id FROM jobs WHERE LOWER(TRIM(title)) = ? AND LOWER(TRIM(company)) = ?'
  ).get(title.toLowerCase().trim(), company.toLowerCase().trim());
}

function touchJob(id) {
  db.prepare('UPDATE jobs SET scraped_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}

function insertJob(job) {
  db.prepare(`
    INSERT INTO jobs (title, company, location, description, url, source, match_score)
    VALUES (@title, @company, @location, @description, @url, @source, @match_score)
  `).run(job);
}

function getJobs({ showDismissed = false, showApplied = false } = {}) {
  const dismissedClause = showDismissed ? '' : 'AND dismissed = 0';
  const appliedClause   = showApplied   ? '' : 'AND applied = 0';
  return db.prepare(`
    SELECT id, title, company, location, url, source, match_score, dismissed, applied, scraped_at
    FROM jobs
    WHERE (
      LOWER(location) LIKE '%israel%'
      OR LOWER(location) LIKE '%tel aviv%'
      OR LOWER(location) LIKE '%petah tikva%'
      OR LOWER(location) LIKE '%haifa%'
      OR LOWER(location) LIKE '%jerusalem%'
      OR LOWER(location) LIKE '%rishon%'
      OR LOWER(location) LIKE '%herzliya%'
      OR LOWER(location) LIKE '%ramat gan%'
      OR LOWER(location) LIKE '%netanya%'
      OR LOWER(location) LIKE '%beer sheva%'
      OR LOWER(location) LIKE '%rehovot%'
      OR LOWER(location) LIKE '%modiin%'
      OR LOWER(location) LIKE '%givatayim%'
    )
    ${dismissedClause}
    ${appliedClause}
    ORDER BY match_score DESC
  `).all();
}

function markJobAsApplied(id) {
  db.prepare('UPDATE jobs SET applied = 1 WHERE id = ?').run(id);
}

function unmarkJobAsApplied(id) {
  db.prepare('UPDATE jobs SET applied = 0 WHERE id = ?').run(id);
}

function getJobById(id) {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
}

function dismissJob(id) {
  db.prepare('UPDATE jobs SET dismissed = 1 WHERE id = ?').run(id);
}

function undismissJob(id) {
  db.prepare('UPDATE jobs SET dismissed = 0 WHERE id = ?').run(id);
}

function insertApplication(jobId) {
  const job = db.prepare('SELECT title, company, url, location FROM jobs WHERE id = ?').get(jobId);
  db.prepare(
    'INSERT INTO applications (job_id, status, title, company, url, location) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(jobId, 'applied', job?.title || '', job?.company || '', job?.url || '', job?.location || '');
}

function insertManualApplication({ title, company, url, location, status }) {
  db.prepare(
    'INSERT INTO applications (job_id, status, title, company, url, location) VALUES (NULL, ?, ?, ?, ?, ?)'
  ).run(status || 'applied', title || '', company || '', url || '', location || '');
}

function updateApplicationStatus(id, status) {
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, id);
}

function getApplications() {
  return db.prepare(`
    SELECT a.id, a.applied_at, a.status,
           COALESCE(a.title,    j.title)    AS title,
           COALESCE(a.company,  j.company)  AS company,
           COALESCE(a.url,      j.url)      AS url,
           COALESCE(a.location, j.location) AS location,
           j.source, j.match_score
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    ORDER BY a.applied_at DESC
  `).all();
}

function getApplicationCounts() {
  const rows = db.prepare(
    "SELECT status, COUNT(*) AS n FROM applications GROUP BY status"
  ).all();
  const counts = { applied: 0, interview: 0, rejected: 0, accepted: 0 };
  rows.forEach((r) => { if (r.status in counts) counts[r.status] = r.n; });
  counts.total = rows.reduce((s, r) => s + r.n, 0);
  return counts;
}

function getJobCount() {
  const total           = db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n;
  const matched         = db.prepare('SELECT COUNT(*) AS n FROM jobs WHERE match_score >= 70').get().n;
  const dismissed       = db.prepare('SELECT COUNT(*) AS n FROM jobs WHERE dismissed = 1').get().n;
  const appliedThisWeek = db.prepare(`
    SELECT COUNT(*) AS n FROM applications
    WHERE applied_at >= datetime('now', '-7 days')
  `).get().n;
  const lastScrapedAt   = db.prepare('SELECT MAX(scraped_at) AS t FROM jobs').get().t;
  const lastScrapeErrorCount = lastScrapedAt
    ? db.prepare("SELECT COUNT(*) AS n FROM errors WHERE created_at >= ?").get(lastScrapedAt).n
    : 0;

  const appliedJobs = db.prepare('SELECT COUNT(*) AS n FROM jobs WHERE applied = 1').get().n;
  return { total, matched, dismissed, appliedJobs, appliedThisWeek, lastScrapedAt, lastScrapeErrorCount };
}

function deleteApplication(id) {
  db.prepare('DELETE FROM applications WHERE id = ?').run(id);
}

function insertError(source, message) {
  db.prepare('INSERT INTO errors (source, message) VALUES (?, ?)').run(source, message);
}

function getRecentErrors(limit) {
  return db.prepare('SELECT * FROM errors ORDER BY created_at DESC LIMIT ?').all(limit);
}

module.exports = {
  findJobByUrl,
  findJobByTitleAndCompany,
  touchJob,
  insertJob,
  getJobs,
  getJobById,
  dismissJob,
  undismissJob,
  markJobAsApplied,
  unmarkJobAsApplied,
  insertApplication,
  insertManualApplication,
  updateApplicationStatus,
  getApplications,
  getApplicationCounts,
  getJobCount,
  deleteApplication,
  insertError,
  getRecentErrors,
};
