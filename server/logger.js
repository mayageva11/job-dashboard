const LEVELS = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level, message) {
  process.stdout.write(`[${formatTimestamp()}] [${level}] ${message}\n`);
}

const logger = {
  info:  (msg) => log(LEVELS.INFO,  msg),
  warn:  (msg) => log(LEVELS.WARN,  msg),
  error: (msg) => log(LEVELS.ERROR, msg),
};

module.exports = logger;
