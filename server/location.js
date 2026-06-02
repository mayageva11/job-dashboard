const { ISRAEL_LOCATION_KEYWORDS } = require('./constants');

function isIsraeliJob(location) {
  const lower = (location || '').toLowerCase();
  return ISRAEL_LOCATION_KEYWORDS.some((kw) => lower.includes(kw));
}

module.exports = { isIsraeliJob };
