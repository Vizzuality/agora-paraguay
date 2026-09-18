import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchFilters, fetchIndicators } from '@/lib/api/metadata/client';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchFilters', () => {
  /** The live response (Sept 2026): a category and two dates, one with a default. */
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
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves the fixture — there is no list endpoint yet', async () => {
    const { sanitarioIndicatorsFixture } = await import('@/lib/api/metadata/fixtures/indicators');

    await expect(fetchIndicators({ riesgo: 'sanitario', cultivo: 'soy' })).resolves.toEqual(
      sanitarioIndicatorsFixture,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
