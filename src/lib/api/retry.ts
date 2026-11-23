import { ZodError } from 'zod';

import { ApiError } from '@/lib/api/http';

/**
 * Whether a failed query tries once more. Only a failure that may pass on its own does:
 * an outage (no status) or a 5xx. A 4xx or an answer that breaks its schema fails the
 * same way again, so retrying only re-sends the request and delays the error.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof ZodError) return false;
  if (error instanceof ApiError && error.status !== null && error.status < 500) return false;

  return true;
}
