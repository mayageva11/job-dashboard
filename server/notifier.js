const nodemailer = require('nodemailer');
const logger = require('./logger');
const db = require('./db');

function buildTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildEmailBody(jobs) {
  return jobs
    .map((j) => `${j.title} @ ${j.company} | ${j.match_score}% | ${j.url}`)
    .join('\n');
}

async function sendDigest(newJobs) {
  if (newJobs.length === 0) return;

  try {
    const transport = buildTransport();
    await transport.sendMail({
      from:    process.env.SMTP_USER,
      to:      process.env.NOTIFY_EMAIL,
      subject: `[Job Dashboard] ${newJobs.length} new matching jobs found`,
      text:    buildEmailBody(newJobs),
    });
    logger.info(`[notifier] Digest sent — ${newJobs.length} jobs`);
  } catch (err) {
    const msg = `[notifier] Failed to send digest: ${err.message}`;
    logger.error(msg);
    db.insertError('notifier', msg);
  }
}

module.exports = { sendDigest };
