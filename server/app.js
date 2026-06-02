const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ERRORS_LIMIT } = require('./constants');
const logger = require('./logger');
const db = require('./db');

const VALID_STATUSES = ['applied', 'interview', 'rejected', 'accepted'];

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
const scrapeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.use(globalLimiter);

app.get('/api/jobs', (req, res) => {
  const showDismissed = req.query.showDismissed === '1';
  const showApplied   = req.query.showApplied   === '1';
  res.json(db.getJobs({ showDismissed, showApplied }));
});

app.get('/api/jobs/count', (req, res) => {
  res.json(db.getJobCount());
});

app.post('/api/jobs/:id/dismiss', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  if (!db.getJobById(id)) return res.status(404).json({ error: 'Job not found' });
  db.dismissJob(id);
  res.json({ ok: true });
});

app.post('/api/jobs/:id/undismiss', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  if (!db.getJobById(id)) return res.status(404).json({ error: 'Job not found' });
  db.undismissJob(id);
  res.json({ ok: true });
});

app.post('/api/scrape', scrapeLimiter, async (req, res) => {
  try {
    const { runScrape } = require('./scheduler');
    await runScrape();
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[api] /api/scrape error: ${err.message}`);
    res.status(500).json({ error: 'Scrape failed' });
  }
});

app.post('/api/apply/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  const job = db.getJobById(id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  db.insertApplication(id);
  db.markJobAsApplied(id);
  res.json({
    url:      job.url,
    name:     process.env.APPLY_NAME,
    email:    process.env.APPLY_EMAIL,
    phone:    process.env.APPLY_PHONE,
    linkedin: process.env.APPLY_LINKEDIN,
  });
});

app.get('/api/applied', (req, res) => {
  res.json(db.getApplications());
});

app.get('/api/applied/counts', (req, res) => {
  res.json(db.getApplicationCounts());
});

app.post('/api/applied/manual', (req, res) => {
  const { title, company, url, location, status } = req.body;
  if (!title || !company) return res.status(400).json({ error: 'title and company are required' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.insertManualApplication({ title, company, url, location, status });
  res.json({ ok: true });
});

app.patch('/api/applied/:id/status', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.updateApplicationStatus(id, status);
  res.json({ ok: true });
});

app.delete('/api/applied/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  db.deleteApplication(id);
  res.json({ ok: true });
});

app.get('/api/cv', (req, res) => {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const files = fs.existsSync(assetsDir)
    ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.pdf'))
    : [];
  if (!files.length) return res.status(404).json({ error: 'CV not found' });
  const cvPath = path.join(assetsDir, files[0]);
  res.setHeader('Content-Disposition', `attachment; filename="${files[0]}"`);
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(cvPath).pipe(res);
});

app.get('/api/errors', (req, res) => {
  res.json(db.getRecentErrors(ERRORS_LIMIT));
});

app.post('/api/gmail/sync', (req, res) => {
  const { emails } = req.body;
  if (!Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });
  const { syncEmails } = require('./gmail-sync');
  const updates = syncEmails(emails);
  res.json({ updates, count: updates.length });
});

app.post('/api/gmail/sync-trigger', (req, res) => {
  res.json({ count: 0, message: 'Run "Sync Gmail" from Claude Code to scan your inbox.' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
