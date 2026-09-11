import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchIndicators } from '@/lib/api/metadata/client';
import { indicatorsFixture } from '@/lib/api/metadata/fixtures/indicators';
import { indicatorsSchema } from '@/lib/api/metadata/schemas';

/** Mock branch — `VITE_USE_MOCK_API` is pinned to true in `vitest.config.ts`. */
describe('fetchIndicators (mock)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("answers the spec's example for any riesgo without touching the network", async () => {
    await expect(fetchIndicators({ riesgo: 'productivo' })).resolves.toEqual(indicatorsFixture);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the fixture honest against the contract, with a default indicator to analyse', () => {
    expect(() => indicatorsSchema.parse(indicatorsFixture)).not.toThrow();
    expect(indicatorsFixture.some((indicator) => indicator.default)).toBe(true);
  });
});
