const db     = require('./db');
const logger = require('./logger');

const STATUS_SIGNALS = {
  rejected: [
    'unfortunately',
    'not moving forward',
    'moving forward with other',
    'other candidates',
    'decided to move forward with other',
    'position has been filled',
    'we will not be moving',
    'not a fit',
    'not the right fit',
    'decided not to proceed',
    'we have decided',
    'thank you for your interest',
    'keep your resume on file',
    'לא נמשיך',
    'החלטנו לא',
    'מועמדים אחרים',
  ],
  interview: [
    'interview',
    'schedule a call',
    'phone screen',
    'screening call',
    'next steps',
    'would like to speak',
    'like to invite you',
    'interested in your profile',
    'would love to connect',
    'technical interview',
    'home assignment',
    'ראיון',
    'שיחת טלפון',
    'נשמח לדבר',
    'מבחן בית',
  ],
  accepted: [
    'offer',
    'pleased to offer',
    'congratulations',
    'excited to offer',
    'job offer',
    'הצעת עבודה',
    'מציעים לך',
    'ברכות',
  ],
};

function detectStatus(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();

  if (STATUS_SIGNALS.accepted.some((kw) => text.includes(kw)))  return 'accepted';
  if (STATUS_SIGNALS.interview.some((kw) => text.includes(kw))) return 'interview';
  if (STATUS_SIGNALS.rejected.some((kw) => text.includes(kw)))  return 'rejected';

  return null;
}

function normalizeCompany(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\s+(ltd|inc|llc|corp|gmbh|co\.|technologies|tech|software|systems)\b/g, '')
    .replace(/[^a-z0-9א-ת]/g, '')
    .trim();
}

function findMatchingApplication(fromAddress, fromName, subject) {
  const applications = db.getApplications();
  if (!applications.length) return null;

  const senderDomain   = (fromAddress || '').split('@')[1]?.split('.')[0]?.toLowerCase() || '';
  const normalizedFrom = normalizeCompany(fromName);

  return applications.find((app) => {
    const normalizedCompany = normalizeCompany(app.company);
    if (!normalizedCompany) return false;

    if (senderDomain && normalizedCompany.includes(senderDomain)) return true;
    if (normalizedFrom && normalizedCompany.includes(normalizedFrom)) return true;
    if (normalizedFrom && normalizedFrom.includes(normalizedCompany)) return true;

    return false;
  });
}

function processEmail({ id, subject, from, body, date }) {
  const newStatus = detectStatus(subject, body);
  if (!newStatus) return null;

  const match = findMatchingApplication(from?.address, from?.name, subject);
  if (!match) return null;

  if (match.status === newStatus) return null;

  db.updateApplicationStatus(match.id, newStatus);
  logger.info(`[gmail-sync] Updated "${match.company}" → ${newStatus} (email: "${subject}")`);

  return {
    applicationId: match.id,
    company:       match.company,
    title:         match.title,
    oldStatus:     match.status,
    newStatus,
    emailSubject:  subject,
    emailDate:     date,
  };
}

function syncEmails(emails) {
  const updates = [];
  for (const email of emails) {
    try {
      const result = processEmail(email);
      if (result) updates.push(result);
    } catch (err) {
      logger.error(`[gmail-sync] Failed to process email "${email.subject}": ${err.message}`);
    }
  }
  logger.info(`[gmail-sync] Processed ${emails.length} emails → ${updates.length} status updates`);
  return updates;
}

module.exports = { syncEmails, detectStatus, normalizeCompany, findMatchingApplication };
