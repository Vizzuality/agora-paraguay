import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiError } from '@/lib/api/http';
import { shouldRetryQuery } from '@/lib/api/retry';

const contractBreak = z.object({ id: z.number() }).safeParse({}).error;

describe('shouldRetryQuery', () => {
  it('retries an outage and a server error once', () => {
    expect(shouldRetryQuery(0, new ApiError('/api/x/', null))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError('/api/x/', 503))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError('/api/x/', 503))).toBe(false);
  });

  it('never retries a client error, which would fail the same way', () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(shouldRetryQuery(0, new ApiError('/api/x/', status))).toBe(false);
    }
  });

  it('never retries an answer that breaks its schema', () => {
    expect(shouldRetryQuery(0, contractBreak)).toBe(false);
  });

  it('retries an unknown failure once, like a network error', () => {
    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
  });
});
