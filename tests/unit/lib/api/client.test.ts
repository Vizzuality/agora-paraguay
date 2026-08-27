import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchPlaceholders, submitAnalysis } from '@/lib/api/client';
import {
  analysisResponseSchema,
  placeholderListSchema,
  type AnalysisRequest,
} from '@/lib/api/schemas';

const SQUARE: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

function request(featureCount = 1): AnalysisRequest {
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: featureCount }, (_, index) => ({
      type: 'Feature' as const,
      properties: { name: `Área ${index + 1}` },
      geometry: { type: 'Polygon' as const, coordinates: [SQUARE] },
    })),
  };
}

describe('fetchPlaceholders', () => {
  it('returns data that satisfies the schema', async () => {
    const data = await fetchPlaceholders();

    expect(() => placeholderListSchema.parse(data)).not.toThrow();
    expect(data.length).toBeGreaterThan(0);
  });

  it('returns parsed objects, not the raw fixture reference', async () => {
    const first = await fetchPlaceholders();
    const second = await fetchPlaceholders();

    // Zod returns a new object per parse; mutating one caller's result must not
    // leak into the next. This is the bug that hides until two components share a
    // fixture-backed query.
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe('submitAnalysis', () => {
  // The mock branch simulates latency and logs the payload; fake timers keep the suite
  // fast and the console quiet.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function submit(input: AnalysisRequest) {
    const pending = submitAnalysis(input);

    await vi.runAllTimersAsync();

    return pending;
  }

  it('accepts the request, echoing how many features it received', async () => {
    const response = await submit(request(3));

    expect(() => analysisResponseSchema.parse(response)).not.toThrow();
    expect(response.status).toBe('accepted');
    expect(response.receivedFeatures).toBe(3);
  });

  it('mints a distinct id per submission', async () => {
    const first = await submit(request());
    const second = await submit(request());

    expect(first.id).not.toBe(second.id);
  });

  it('rejects a malformed request at the boundary', async () => {
    const empty = { type: 'FeatureCollection', features: [] } as unknown as AnalysisRequest;

    await expect(submitAnalysis(empty)).rejects.toThrow(ZodError);
  });
});
