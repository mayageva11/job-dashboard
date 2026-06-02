require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { REQUIRED_ENV } = require('./constants');
const logger = require('./logger');
const { startScheduler } = require('./scheduler');
const app = require('./app');

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  process.stderr.write(`Missing required env variables: ${missing.join(', ')}\n`);
  process.stderr.write('See .env.example\n');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`[server] Listening on port ${PORT}`);
  startScheduler();
});
