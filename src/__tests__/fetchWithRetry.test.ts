import { fetchWithRetry } from '@/lib/osint/fetchWithRetry';

describe('fetchWithRetry utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns response immediately on successful 200 HTTP call', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    } as unknown as Response;
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const res = await fetchWithRetry('https://example.com/api', {}, { retries: 2, backoffMs: 10 });
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 503 Service Unavailable and succeeds on second attempt', async () => {
    const errorResponse = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers(),
    } as unknown as Response;
    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    } as unknown as Response;

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const res = await fetchWithRetry(
      'https://example.com/flaky',
      {},
      { retries: 2, backoffMs: 10 }
    );
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws error after exhausting configured retries', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection timed out'));

    await expect(
      fetchWithRetry('https://example.com/down', {}, { retries: 1, backoffMs: 5, timeoutMs: 100 })
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
