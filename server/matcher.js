const path = require('path');
const {
  MATCH_THRESHOLD,
  SCORE_CAP_NEGATIVE,
  TITLE_BOOST,
  EXPERIENCE_BOOST,
  SCORE_DENOMINATOR,
  MAX_EXPERIENCE_YEARS,
} = require('./constants');

const profile = require(path.join(__dirname, '..', 'profile.json'));

function containsWord(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\d\\w])${escaped}(?![\\d\\w])`, 'i').test(text);
}

function extractMaxYears(text) {
  const rangeMatch = [...text.matchAll(/(\d+)\s*[-–to]+\s*(\d+)\s*years?/gi)];
  if (rangeMatch.length) {
    return Math.max(...rangeMatch.map((m) => parseInt(m[2] || m[1])));
  }
  const single = text.match(/(\d{1,2})\+?\s*years?/i);
  return single ? parseInt(single[1]) : null;
}

function isEntryLevel(text) {
  return /\b(junior|entry[\s-]level|graduate|0\s*-\s*[234]|1\s*-\s*[234]|[12]\s*-\s*[34])\b/i.test(text);
}

function scoreTitleOnly(titleLower) {
  const exactTitle = profile.titles.some((t) => titleLower.includes(t.toLowerCase()));
  if (exactTitle) return 85;
  const hasSkillWord = profile.skills.some((s) => containsWord(titleLower, s.keyword));
  if (hasSkillWord) return 72;
  return 0;
}

function scoreJob(job) {
  const titleLower = (job.title || '').toLowerCase();
  const hasDesc    = job.description && job.description.trim().length >= 30;

  const hasNegativeWord = profile.negative_words.some((kw) =>
    containsWord(`${job.title} ${job.description || ''}`.toLowerCase(), kw)
  );
  const yearsRequired = extractMaxYears(`${job.title} ${job.description || ''}`);
  const tooManyYears  = yearsRequired !== null && yearsRequired >= MAX_EXPERIENCE_YEARS;
  const applyNegative = hasNegativeWord || tooManyYears;

  if (!hasDesc) {
    const base = scoreTitleOnly(titleLower);
    return applyNegative ? Math.min(base, SCORE_CAP_NEGATIVE) : base;
  }

  const text = `${job.title} ${job.description}`.toLowerCase();

  let matched = 0;
  for (const skill of profile.skills) {
    if (containsWord(text, skill.keyword)) matched += skill.weight;
  }

  let score = Math.min((matched / SCORE_DENOMINATOR) * 100, 100);

  const titleMatch = profile.titles.some((t) => titleLower.includes(t.toLowerCase()));
  if (titleMatch) score = Math.min(100, score + TITLE_BOOST);

  const entrySignal = isEntryLevel(text) || (yearsRequired !== null && yearsRequired <= 4);
  if (entrySignal) score = Math.min(100, score + EXPERIENCE_BOOST);

  if (applyNegative) score = Math.min(score, SCORE_CAP_NEGATIVE);

  return Math.round(score * 10) / 10;
}

function isMatch(job) {
  return scoreJob(job) >= MATCH_THRESHOLD;
}

module.exports = { scoreJob, isMatch };
