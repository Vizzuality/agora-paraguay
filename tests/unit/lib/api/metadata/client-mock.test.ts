import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFilters, fetchIndicators } from '@/lib/api/metadata/client';
import { filtersFixture } from '@/lib/api/metadata/fixtures/filters';
import {
  indicatorsFixture,
  productivoIndicatorsFixture,
  sanitarioIndicatorsFixture,
} from '@/lib/api/metadata/fixtures/indicators';
import { filtersSchema, indicatorsSchema } from '@/lib/api/metadata/schemas';

/** Mock branch — `VITE_USE_MOCK_API` is pinned to true in `vitest.config.ts`. */
describe('metadata (mock)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the filters fixture without touching the network', async () => {
    await expect(fetchFilters()).resolves.toEqual(filtersFixture);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers the indicators of the riesgo asked without touching the network', async () => {
    await expect(fetchIndicators({ riesgo: 'productivo' })).resolves.toEqual(
      productivoIndicatorsFixture,
    );
    await expect(fetchIndicators({ riesgo: 'sanitario', cultivo: 'soja' })).resolves.toEqual(
      sanitarioIndicatorsFixture,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the fixtures honest against the contracts, with a default indicator to analyse', () => {
    expect(() => filtersSchema.parse(filtersFixture)).not.toThrow();
    expect(() => indicatorsSchema.parse(indicatorsFixture)).not.toThrow();
    expect(indicatorsFixture.some((indicator) => indicator.default)).toBe(true);
  });
});
