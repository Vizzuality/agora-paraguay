import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchGlobalLayers, globalLayerTilesUrl } from '@/lib/api/layers/client';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchGlobalLayers', () => {
  /** The live response, trimmed to two layers. */
  const layers = [
    {
      id: 6,
      name: 'Drought hazard map',
      type: 2,
      description: 'Drought hazard map',
      source: '',
    },
    {
      id: 8,
      name: 'Soja crops map',
      type: 0,
      description: 'Soja crops map',
      source: '',
    },
  ];

  it('GETs /api/parcels/global_layers/ and parses the list', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(layers));

    await expect(fetchGlobalLayers()).resolves.toEqual(layers);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/parcels/global_layers/');
  });

  it('rejects a layer without a name', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ id: 1, type: 0 }]));

    await expect(fetchGlobalLayers()).rejects.toBeInstanceOf(ZodError);
  });
});

describe('globalLayerTilesUrl', () => {
  it("points at the layer's tiles on the page origin, placeholders left for MapLibre", () => {
    expect(globalLayerTilesUrl(9, 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/parcels/global_layer_tiles/9/{z}/{x}/{y}.pbf',
    );
  });
});
