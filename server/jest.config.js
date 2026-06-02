module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
  collectCoverageFrom: [
    '*.js',
    'scraper/*.js',
    '!index.js',
    '!jest.config.js',
  ],
};
