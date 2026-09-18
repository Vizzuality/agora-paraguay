import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchIndicators } from '@/lib/api/metadata/client';
import {
  productivoIndicatorsFixture,
  sanitarioIndicatorsFixture,
} from '@/lib/api/metadata/fixtures/indicators';
import { indicatorsSchema } from '@/lib/api/metadata/schemas';

/** The indicator list has no endpoint yet: the fixture answers, network untouched. */
describe('fetchIndicators (fixture)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('keeps both fixtures honest against the contract, with a default indicator to analyse', () => {
    for (const fixture of [sanitarioIndicatorsFixture, productivoIndicatorsFixture]) {
      expect(() => indicatorsSchema.parse(fixture)).not.toThrow();
      expect(fixture.some((indicator) => indicator.default)).toBe(true);
    }
  });
});
