const logger = require('../logger');

describe('logger', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((msg) => {
      output.push(msg);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('info outputs [INFO] level', () => {
    logger.info('test info message');
    expect(output[0]).toContain('[INFO]');
    expect(output[0]).toContain('test info message');
  });

  test('warn outputs [WARN] level', () => {
    logger.warn('test warning');
    expect(output[0]).toContain('[WARN]');
    expect(output[0]).toContain('test warning');
  });

  test('error outputs [ERROR] level', () => {
    logger.error('test error');
    expect(output[0]).toContain('[ERROR]');
    expect(output[0]).toContain('test error');
  });

  test('output includes ISO-style timestamp', () => {
    logger.info('timestamp test');
    expect(output[0]).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
  });

  test('each log line ends with newline', () => {
    logger.info('newline test');
    expect(output[0]).toMatch(/\n$/);
  });
});
