import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchFilters, fetchIndicators } from '@/lib/api/metadata/client';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchFilters', () => {
  /** The live response: a category and two dates, one with a default. */
  const filters = [
    {
      id: 'crop_type',
      name: 'Tipo de cultivo',
      description: 'Cultivo a evaluar.',
      field_type: {
        type: 'category',
        options: [
          { value: 'rice', label: 'Arroz' },
          { value: 'soy', label: 'Soja' },
        ],
      },
    },
    {
      id: 'sowing_date',
      name: 'Fecha de siembra',
      field_type: { type: 'date', format: 'YYYY-MM-DD', default: null },
    },
    { id: 'date', name: 'Fecha', field_type: { type: 'date', default: '2026-09-17' } },
  ];

  it('GETs /api/parcels/filters/ for the visibility asked and accepts categories and dates', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(filters));

    await expect(fetchFilters({ visibility: 'private' })).resolves.toEqual(filters);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/parcels/filters/?visibility=private');
  });

  it('rejects a field type it has no control for, and a non-ISO date default', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 'x', name: 'X', field_type: { type: 'range', min: 0, max: 1 } }]),
    );
    await expect(fetchFilters({ visibility: 'public' })).rejects.toThrow(ZodError);

    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 'd', name: 'D', field_type: { type: 'date', default: '17/09/2026' } }]),
    );
    await expect(fetchFilters({ visibility: 'public' })).rejects.toThrow(ZodError);
  });
});

describe('fetchIndicators', () => {
  const indicators = [
    {
      id: 'data_quality',
      name: 'Calidad de los datos',
      unit: '%',
      default: true,
      indicator_type: { type: 'range', min: 0, max: 100, step: '1' },
    },
    { id: 'weather_station', name: 'Estación', indicator_type: { type: 'text' } },
    { id: 'Pro_soja', name: 'Producción', unit: 't/ha', indicator_type: { type: 'numeric' } },
  ];

  it('POSTs the analysis path of the riesgo with no parcels and the cultivo as crop', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(indicators));

    await expect(fetchIndicators({ riesgo: 'sanitario', cultivo: 'soy' })).resolves.toEqual(
      indicators,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/parcels/analysis/diseases/');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(init?.body))).toEqual({
      parcel_ids: [],
      filters: { crop: 'soy' },
    });
  });

  it('POSTs the production path with empty filters when there is no cultivo', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));

    await expect(fetchIndicators({ riesgo: 'productivo' })).resolves.toEqual([]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/parcels/analysis/production/');
    expect(JSON.parse(String(init?.body))).toEqual({ parcel_ids: [], filters: {} });
  });

  it('unwraps the list when it arrives inside the analysis envelope', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'ok', indicators }));

    await expect(fetchIndicators({ riesgo: 'sanitario' })).resolves.toEqual(indicators);
  });

  it('rejects an indicator type it has no card for', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 'x', name: 'X', indicator_type: { type: 'gauge' } }]),
    );

    await expect(fetchIndicators({ riesgo: 'sanitario' })).rejects.toThrow(ZodError);
  });
});
