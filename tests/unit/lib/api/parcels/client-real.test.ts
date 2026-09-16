import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import {
  fetchParcelDiseases,
  FILTER_PARCELS_PATH,
  filterParcels,
  PARCEL_DISEASES_PATH,
} from '@/lib/api/parcels/client';
import type { FilterParcelsRequest } from '@/lib/api/parcels/schemas';

// The real branch, with the mock flag off. Own file: `vi.mock` is hoisted per module.
vi.mock('@/env', () => ({ env: { VITE_USE_MOCK_API: false } }));

const SQUARE: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

function request(): FilterParcelsRequest {
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
  };
}

const response = {
  status: 'success',
  message: '',
  input: { features: [{ id: 0 }] },
  results: [
    { parcel_id: 8668, geometry: { type: 'FeatureCollection', features: [] }, selected: true },
  ],
};

describe('filterParcels (real)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the documented body to filter_parcels with the CSRF token and parses the results', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(response));

    await expect(filterParcels(request())).resolves.toEqual(response);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(FILTER_PARCELS_PATH);
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'abc' },
      body: JSON.stringify(request()),
    });
  });

  it('surfaces an HTTP failure as an ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(filterParcels(request())).rejects.toMatchObject({ name: 'ApiError', status: 403 });
  });

  it('rejects a response that does not match the contract', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ type: 'FeatureCollection', features: [] }));

    await expect(filterParcels(request())).rejects.toThrow(ZodError);
  });
});

describe('fetchParcelDiseases (real)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  const diseasesRequest = {
    parcel_ids: [8668],
    crop: 'soja',
    start_date: '2026-06-18',
    end_date: '2026-08-18',
  };

  /** The public scoring: one Feature per parcel, disease indices as columns. */
  const diseases = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { parcela_id: 'D07D21P00000001', asian_rust: '2', brown_spot: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
      },
    ],
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the parcel ids and filters to get-parcel-diseases/ and parses the scored parcels', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(diseases));

    await expect(fetchParcelDiseases(diseasesRequest)).resolves.toEqual(diseases);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PARCEL_DISEASES_PATH);
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'X-CSRFToken': 'abc' },
      body: JSON.stringify(diseasesRequest),
    });
  });

  it('lets fields the contract has not fixed yet through to the backend', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(diseases));

    await fetchParcelDiseases({ parcel_ids: [1], cycle: 'zafra' });

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      parcel_ids: [1],
      cycle: 'zafra',
    });
  });

  it('rejects an empty parcel list or a non-ISO date before touching the network', async () => {
    await expect(fetchParcelDiseases({ parcel_ids: [] })).rejects.toThrow(ZodError);
    await expect(
      fetchParcelDiseases({ parcel_ids: [1], start_date: '18/06/2026' }),
    ).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a response that is not a FeatureCollection of parcels', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ results: [] }));

    await expect(fetchParcelDiseases(diseasesRequest)).rejects.toThrow(ZodError);
  });
});
