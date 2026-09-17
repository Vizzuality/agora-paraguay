import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

// These assert on the real fetch; the mock branch is covered in `client-mock.test.ts`.
vi.mock('@/env', () => ({ env: { VITE_USE_MOCK_API: false } }));

import { analyzeSelection, runAnalysis } from '@/lib/api/analysis/client';
import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
} from '@/lib/api/analysis/schemas';

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

/** The public analysis shape: one Feature per analysed parcel, indicators as columns. */
const response = {
  type: 'FeatureCollection',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::32721' } },
  features: [
    {
      type: 'Feature',
      properties: {
        fid: 2161,
        area: '18025.552734375',
        parcela_id: 'D07D21P00000001',
        weather_station: 'Colonias Unidas - Capitán Meza',
        data_quality: '92',
        crop_type: 'Soja',
        phenology_stage: 'R5 (Inicio de grano)',
        asian_rust: '2',
        brown_spot: '1',
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [676462.8, 7077914.9],
              [676522.8, 7077914.9],
              [676462.8, 7077854.9],
              [676462.8, 7077914.9],
            ],
          ],
        ],
      },
    },
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
  it("accepts the backend sample's FeatureCollection, numbers-as-strings included", () => {
    expect(analysisResponseSchema.safeParse(response).success).toBe(true);
  });

  it('keeps unknown property columns — they are the indicators', () => {
    const parsed = analysisResponseSchema.parse(response);

    expect(parsed.features[0].properties.asian_rust).toBe('2');
  });

  it('rejects a parcel without parcela_id, and the old pre-aggregated shape', () => {
    const [feature] = response.features;
    const { parcela_id: _id, ...properties } = feature.properties;

    expect(
      analysisResponseSchema.safeParse({ ...response, features: [{ ...feature, properties }] })
        .success,
    ).toBe(false);
    expect(
      analysisResponseSchema.safeParse({ indicators: [{ id: 'iep', value: 70 }] }).success,
    ).toBe(false);
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

  it('POSTs to the visibility path and parses the analysed parcels', async () => {
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

  const filters = {
    fechaSiembra: '2026-06-18',
    fechaAnalisis: '2026-08-18',
    cultivo: 'soja',
    ciclo: 'zafra',
    fechaInicio: '2010-01-01',
    fechaFin: '2025-12-31',
  };

  /** Answers by verb: the indicator list and the analysis share the path — GET lists, POST runs. */
  function respondByPath() {
    fetchMock.mockImplementation((_input, init) =>
      Promise.resolve(
        init?.method === 'GET'
          ? Response.json([{ id: 'iep', name: 'IEP', default: true }])
          : Response.json(response),
      ),
    );
  }

  function calledPaths() {
    return fetchMock.mock.calls.map(([input, init]) => `${init?.method} ${input}`);
  }

  function bodyOf(path: string) {
    const call = fetchMock.mock.calls.find(
      ([input, init]) => init?.method === 'POST' && String(input) === path,
    );

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

  it('asks the sanitario indicators and runs the public analysis over the given parcels', async () => {
    const result = await analyzeSelection({ visibility: 'public', parcelIds: [8668], filters });

    expect(result).toEqual(response);
    expect(calledPaths()).toEqual([
      'GET /api/analysis/public?cultivo=soja',
      'POST /api/analysis/public',
    ]);
    expect(bodyOf('/api/analysis/public')).toEqual({
      parcel_ids: [8668],
      filters: {
        crop: 'soja',
        cycle: 'zafra',
        start_date: '2026-06-18',
        end_date: '2026-08-18',
        indicators: ['iep'],
      },
    });
  });

  it('asks productivo indicators without cultivo', async () => {
    await analyzeSelection({ visibility: 'private', parcelIds: [8668, 12], filters });

    expect(calledPaths()).toEqual(['GET /api/analysis/private', 'POST /api/analysis/private']);
    expect(bodyOf('/api/analysis/private').parcel_ids).toEqual([8668, 12]);
  });

  it('fails before the analysis call when no parcel was selected', async () => {
    await expect(
      analyzeSelection({ visibility: 'public', parcelIds: [], filters }),
    ).rejects.toThrow(ZodError);
    expect(calledPaths()).not.toContain('POST /api/analysis/public');
  });
});
