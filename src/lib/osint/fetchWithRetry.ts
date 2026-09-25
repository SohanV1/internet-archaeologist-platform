/**
 * Resilient fetch utility with exponential backoff, timeout handling, and retry logic
 * for passive OSINT reconnaissance queries.
 */

export interface FetchRetryOptions {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
  retryOnStatus?: number[];
}

const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

import { isSafeUrlForFetch } from './validator';

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: FetchRetryOptions
): Promise<Response> {
  const safetyCheck = isSafeUrlForFetch(url);
  if (!safetyCheck.safe) {
    throw new Error(`SSRF Prevention Block: ${safetyCheck.reason || 'Restricted outbound target'}`);
  }

  const maxRetries = options?.retries ?? 2;
  const initialBackoff = options?.backoffMs ?? 600;
  const timeoutMs = options?.timeoutMs ?? 6000;
  const retryStatuses = options?.retryOnStatus ?? DEFAULT_RETRY_STATUSES;

  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      // Chain user-provided signal if present
      const signal = init?.signal
        ? AbortSignal.any([init.signal, controller.signal])
        : controller.signal;

      const response = await fetch(url, {
        ...init,
        headers: {
          'User-Agent':
            'InternetArchaeologist-PassiveOSINT/2.1 (+https://github.com/SohanV1/osint_tool)',
          ...(options?.headers || {}),
          ...(init?.headers || {}),
        },
        signal,
      });

      clearTimeout(timeoutId);

      // If status indicates transient server failure or rate limiting, retry
      if (retryStatuses.includes(response.status) && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : initialBackoff * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 4000)));
        continue;
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 200);
        const delay = initialBackoff * Math.pow(2, attempt) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Fetch request failed after ${maxRetries} retries for URL: ${url}`);
}
