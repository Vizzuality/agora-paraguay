import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { FILTER_PARCELS_PATH, filterParcels } from '@/lib/api/parcels/client';
import type { FilterParcelsRequest } from '@/lib/api/parcels/schemas';

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
    {
      parcel_id: 'D07D21P00000002',
      geometry: { type: 'FeatureCollection', features: [] },
      selected: true,
    },
  ],
};

describe('filterParcels', () => {
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

  // The backend's answers by status, as `ApiError` exposes them to the UI: `status` tells
  // the kind of failure apart, `detail` quotes Django's reason when the body carries one.
  describe('error answers', () => {
    it('400 invalid geometry: a DRF field error becomes the detail, without the field name', async () => {
      fetchMock.mockResolvedValueOnce(
        Response.json(
          { filtering_polygons: ['Self-intersection at or near point -56.5 -25.0'] },
          { status: 400 },
        ),
      );

      await expect(filterParcels(request())).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        detail: 'Self-intersection at or near point -56.5 -25.0',
      });
    });

    it('400 with a top-level `detail` quotes it', async () => {
      fetchMock.mockResolvedValueOnce(
        Response.json({ detail: 'JSON parse error - Expecting value' }, { status: 400 }),
      );

      await expect(filterParcels(request())).rejects.toMatchObject({
        status: 400,
        detail: 'JSON parse error - Expecting value',
      });
    });

    it.each([
      [401, 'Authentication credentials were not provided.'],
      [403, 'CSRF Failed: CSRF token missing.'],
      [405, 'Method "GET" not allowed.'],
    ])('%i carries the DRF `detail`', async (status, detail) => {
      fetchMock.mockResolvedValueOnce(Response.json({ detail }, { status }));

      await expect(filterParcels(request())).rejects.toMatchObject({ status, detail });
    });

    it('404 on an HTML body (Django debug page, nginx) carries no detail', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('<!doctype html><title>Not Found</title>', {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

      await expect(filterParcels(request())).rejects.toMatchObject({ status: 404, detail: null });
    });

    it.each([413, 500, 502, 504])(
      '%i with an empty or HTML body is an ApiError without detail',
      async (status) => {
        fetchMock.mockResolvedValueOnce(
          new Response(status === 413 ? '' : '<html>bad gateway</html>', { status }),
        );

        await expect(filterParcels(request())).rejects.toMatchObject({
          name: 'ApiError',
          status,
          detail: null,
        });
      },
    );

    it('a network failure (backend down, proxy refused) is an ApiError with a null status', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(filterParcels(request())).rejects.toMatchObject({
        name: 'ApiError',
        status: null,
        detail: null,
      });
    });

    it('an empty polygon list is refused before any request goes out', async () => {
      const empty = request();
      empty.filtering_polygons.features = [];

      await expect(filterParcels(empty)).rejects.toThrow(ZodError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // HTTP 200 answers that are not a list of parcels.
  describe('empty and malformed 200s', () => {
    it('`status: "empty"` with `results: {}` (outside coverage) reads as no parcels, message kept', async () => {
      fetchMock.mockResolvedValueOnce(
        Response.json({
          status: 'empty',
          message: 'The submitted area is outside our current coverage.',
          input: { features: [] },
          results: {},
        }),
      );

      await expect(filterParcels(request())).resolves.toMatchObject({
        status: 'empty',
        message: 'The submitted area is outside our current coverage.',
        results: [],
      });
    });

    it('`results: []` (parcels around, none intersecting) is a success with no parcels', async () => {
      fetchMock.mockResolvedValueOnce(
        Response.json({ status: 'success', message: '', input: {}, results: [] }),
      );

      await expect(filterParcels(request())).resolves.toMatchObject({ results: [] });
    });

    it('a parcel without `selected` or with a non-areal geometry fails the contract', async () => {
      fetchMock.mockResolvedValueOnce(
        Response.json({
          ...response,
          results: [
            { parcel_id: 'D07D21P00000002', geometry: { type: 'Point', coordinates: [0, 0] } },
          ],
        }),
      );

      await expect(filterParcels(request())).rejects.toThrow(ZodError);
    });

    it('a 200 that is not JSON (a login page served by the proxy) fails to parse', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('<!doctype html><title>Login</title>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

      await expect(filterParcels(request())).rejects.toThrow(SyntaxError);
    });
  });
});
