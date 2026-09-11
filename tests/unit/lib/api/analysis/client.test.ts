import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

// These assert on the real fetch; the mock branch is covered in `client-mock.test.ts`.
vi.mock('@/env', () => ({ env: { VITE_USE_MOCK_API: false } }));

import { analysisPath, analyzeSelection, runAnalysis } from '@/lib/api/analysis/client';
import { analysisRequestSchema, analysisResponseSchema } from '@/lib/api/analysis/schemas';
import type { ParcelFeature } from '@/lib/api/parcels/schemas';

const request = {
  parcel_ids: [8668, 7866],
  filters: {
    crop: 'soja',
    cycle: 'zafra',
    start_date: '2026-06-18',
    end_date: '2026-08-18',
    indicators: ['iep'],
  },
};

/** The spec's three value shapes: a number, a set of named numbers, a label. */
const response = {
  indicators: [
    {
      id: 'iep',
      category: 'sanitario',
      date: '2026-08-18',
      value: 70,
      values: [{ label: 'Jun', value: 60, date: '2026-06-18' }],
      display_value: '70 %',
      confidence: 'Alto',
    },
    { id: 'rendimiento', value: { p10: 2.49, p50: 2.77, p90: 2.96 } },
    { id: 'resiliencia', value: 'Baja' },
  ],
};

describe('analysisRequestSchema', () => {
  it('accepts the documented body, with crop and cycle optional (productivo)', () => {
    expect(analysisRequestSchema.safeParse(request).success).toBe(true);

    const { crop: _crop, cycle: _cycle, ...productivo } = request.filters;
    expect(analysisRequestSchema.safeParse({ ...request, filters: productivo }).success).toBe(true);
  });

  it('rejects an empty parcel or indicator list, and a non-ISO date', () => {
    expect(analysisRequestSchema.safeParse({ ...request, parcel_ids: [] }).success).toBe(false);
    expect(
      analysisRequestSchema.safeParse({
        ...request,
        filters: { ...request.filters, indicators: [] },
      }).success,
    ).toBe(false);
    expect(
      analysisRequestSchema.safeParse({
        ...request,
        filters: { ...request.filters, start_date: '18/06/2026' },
      }).success,
    ).toBe(false);
  });
});

describe('analysisResponseSchema', () => {
  it('accepts every value shape the spec shows', () => {
    expect(analysisResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects an indicator without an id', () => {
    expect(analysisResponseSchema.safeParse({ indicators: [{ value: 1 }] }).success).toBe(false);
  });
});

describe('runAnalysis', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the visibility path and parses the indicators', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(response));

    await expect(runAnalysis('private', request)).resolves.toEqual(response);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(analysisPath('private'));
    expect(String(url)).toBe('/api/analysis/private');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'X-CSRFToken': 'abc' },
      body: JSON.stringify(request),
    });
  });

  it('rejects a malformed request before touching the network', async () => {
    await expect(runAnalysis('public', { ...request, parcel_ids: [] })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('analyzeSelection', () => {
  const fetchMock = vi.fn<typeof fetch>();

  const SQUARE: [number, number][] = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ];

  const filters = {
    fechaSiembra: '2026-06-18',
    fechaAnalisis: '2026-08-18',
    cultivo: 'soja',
    ciclo: 'zafra',
    fechaInicio: '2010-01-01',
    fechaFin: '2025-12-31',
  };

  const polygon = {
    id: '6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3e',
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [SQUARE] },
    properties: { mode: 'polygon' },
  } as never;

  const parcel: ParcelFeature = {
    type: 'Feature',
    properties: { id: 'parcel-12', name: 'Parcela 12' },
    geometry: { type: 'Polygon', coordinates: [SQUARE] },
  };

  /** Answers by path, so the order of the parallel calls does not matter. */
  function respondByPath() {
    fetchMock.mockImplementation((input) => {
      const url = String(input);

      if (url.startsWith('/api/indicators/')) {
        return Promise.resolve(Response.json([{ id: 'iep', name: 'IEP', default: true }]));
      }

      if (url === '/api/parcels/filter_parcels') {
        return Promise.resolve(
          Response.json({
            status: 'success',
            message: '',
            results: [
              {
                parcel_id: 8668,
                geometry: { type: 'FeatureCollection', features: [] },
                selected: true,
              },
              {
                parcel_id: 7866,
                geometry: { type: 'FeatureCollection', features: [] },
                selected: false,
              },
            ],
          }),
        );
      }

      return Promise.resolve(Response.json(response));
    });
  }

  function calledPaths() {
    return fetchMock.mock.calls.map(([input]) => String(input));
  }

  function bodyOf(path: string) {
    const call = fetchMock.mock.calls.find(([input]) => String(input) === path);

    return JSON.parse(String(call?.[1]?.body));
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
    respondByPath();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('filters the drawn polygons, keeps the selected parcels, and runs the public analysis', async () => {
    const result = await analyzeSelection({
      visibility: 'public',
      polygons: [polygon],
      parcels: [parcel],
      filters,
    });

    expect(result).toEqual(response);
    expect(calledPaths()).toEqual([
      '/api/indicators/?riesgo=sanitario&cultivo=soja',
      '/api/parcels/filter_parcels',
      '/api/analysis/public',
    ]);
    expect(bodyOf('/api/analysis/public')).toEqual({
      parcel_ids: [8668, 12],
      filters: {
        crop: 'soja',
        cycle: 'zafra',
        start_date: '2026-06-18',
        end_date: '2026-08-18',
        indicators: ['iep'],
      },
    });
  });

  it('skips filter_parcels when nothing was drawn, and asks productivo indicators without cultivo', async () => {
    await analyzeSelection({ visibility: 'private', polygons: [], parcels: [parcel], filters });

    expect(calledPaths()).toEqual(['/api/indicators/?riesgo=productivo', '/api/analysis/private']);
    expect(bodyOf('/api/analysis/private').parcel_ids).toEqual([12]);
  });

  it('fails before the analysis call when there is nothing to analyse', async () => {
    await expect(
      analyzeSelection({ visibility: 'public', polygons: [], parcels: [], filters }),
    ).rejects.toThrow(ZodError);
    expect(calledPaths()).not.toContain('/api/analysis/public');
  });
});
