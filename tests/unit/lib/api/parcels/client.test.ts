import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchParcelDiseases, filterParcels } from '@/lib/api/parcels/client';
import { mockFilterParcels } from '@/lib/api/parcels/fixtures/filter-parcels';
import { parcelDiseasesFixture } from '@/lib/api/parcels/fixtures/parcel-diseases';
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

  it('answers fake parcels around the polygons it is sent, without touching the network', async () => {
    const response = await filterParcels(request());

    expect(response).toEqual(mockFilterParcels(request()));
    expect(() => filterParcelsResponseSchema.parse(response)).not.toThrow();
    expect(response.results.some((parcel) => parcel.selected)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still rejects a malformed request — the body the mock accepts is the body the API gets', async () => {
    await expect(filterParcels(request({ overlap_percentage_threshold: 150 }))).rejects.toThrow(
      ZodError,
    );
  });
});

/** Mock branch — the diseases answer is the analysis fixture, whatever the request. */
describe('fetchParcelDiseases (mock)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the mocked parcels without touching the network', async () => {
    await expect(fetchParcelDiseases({ parcel_ids: [8668], crop: 'soja' })).resolves.toEqual(
      parcelDiseasesFixture,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still rejects a malformed request before answering', async () => {
    await expect(fetchParcelDiseases({ parcel_ids: [] })).rejects.toThrow(ZodError);
  });
});
