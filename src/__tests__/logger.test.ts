import { logger } from '@/lib/osint/logger';

describe('Observability Logger', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emits structured JSON for info logs', () => {
    logger.info('test-service', 'Test information log', { sampleKey: 42 }, 'req-123');
    expect(logSpy).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('INFO');
    expect(parsed.operation).toBe('test-service');
    expect(parsed.message).toBe('Test information log');
    expect(parsed.requestId).toBe('req-123');
    expect(parsed.metadata.sampleKey).toBe(42);
    expect(parsed.timestamp).toBeDefined();
  });

  it('emits structured JSON for warnings', () => {
    logger.warn('test-warn', 'Test warning message', undefined, 'req-456');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(warnSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('WARN');
    expect(parsed.message).toBe('Test warning message');
  });

  it('emits structured JSON and captures error object details', () => {
    const errorObj = new Error('Database connection failure');
    logger.error('db', 'Query failed', errorObj, { table: 'users' }, 'req-789');
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('ERROR');
    expect(parsed.error.name).toBe('Error');
    expect(parsed.error.message).toBe('Database connection failure');
  });

  it('measures async execution duration using profile helper', async () => {
    const mockAsyncWork = jest.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 15));
      return 'work-done';
    });

    const result = await logger.profile('async-task', mockAsyncWork);
    expect(result).toBe('work-done');
    expect(logSpy).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('INFO');
    expect(parsed.durationMs).toBeGreaterThanOrEqual(10);
  });
});
