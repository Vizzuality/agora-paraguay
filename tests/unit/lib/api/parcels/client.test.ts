import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { filterParcels } from '@/lib/api/parcels/client';
import { filterParcelsFixture } from '@/lib/api/parcels/fixtures/filter-parcels';
import { filterParcelsResponseSchema, type FilterParcelsRequest } from '@/lib/api/parcels/schemas';

const SQUARE: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

function request(overrides: Partial<FilterParcelsRequest> = {}): FilterParcelsRequest {
  return {
    filtering_polygons: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: '6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3e', name: 'Polígono 1' },
          geometry: { type: 'Polygon', coordinates: [SQUARE] },
        },
      ],
    },
    overlap_percentage_threshold: 50,
    buffer: 50,
    ...overrides,
  };
}

/** Mock branch — `VITE_USE_MOCK_API` defaults to true under Vitest. */
describe('filterParcels (mock)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("answers the spec's example without touching the network", async () => {
    await expect(filterParcels(request())).resolves.toEqual(filterParcelsFixture);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the fixture honest against the response contract', () => {
    expect(() => filterParcelsResponseSchema.parse(filterParcelsFixture)).not.toThrow();
    expect(filterParcelsFixture.results.map((parcel) => parcel.selected)).toEqual([true, false]);
  });

  it('still rejects a malformed request — the body the mock accepts is the body the API gets', async () => {
    await expect(filterParcels(request({ overlap_percentage_threshold: 150 }))).rejects.toThrow(
      ZodError,
    );
  });
});
