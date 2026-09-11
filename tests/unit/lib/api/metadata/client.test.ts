import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

// These assert on the real fetch; the mock branch is covered in `client-mock.test.ts`.
vi.mock('@/env', () => ({ env: { VITE_USE_MOCK_API: false } }));

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
  const filters = [
    { id: 'filter-1', name: 'Filter 1', options: [{ label: 'Option 1', value: 'option-1' }] },
    { id: 'start-date', name: 'Start date', value: '2010-03-23' },
  ];

  it('GETs /api/filters/ and accepts both list and single-value filters', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(filters));

    await expect(fetchFilters()).resolves.toEqual(filters);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/filters/');
  });

  it('rejects a filter that is neither', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ id: 'x', name: 'X' }]));

    await expect(fetchFilters()).rejects.toThrow(ZodError);
  });
});

describe('fetchIndicators', () => {
  const indicators = [
    {
      id: 'iep',
      name: 'Índice de exposición a plagas',
      description: 'Lorem ipsum',
      unit: '%',
      default: true,
      indicator_type: { type: 'range', min: 0, max: 100, step: '1' },
    },
    {
      id: 'resiliencia',
      name: 'Resiliencia',
      indicator_type: { type: 'category', value: null, categories: ['muy bajo', 'bajo'] },
    },
  ];

  it('GETs /api/indicators/ with the riesgo and cultivo filters as query parameters', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(indicators));

    await expect(fetchIndicators({ riesgo: 'sanitario', cultivo: 'soja' })).resolves.toEqual(
      indicators,
    );
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      '/api/indicators/?riesgo=sanitario&cultivo=soja',
    );
  });

  it('accepts both indicator types, and extra attributes the spec has not fixed yet', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ ...indicators[0], source: 'INBIO' }]));

    const [indicator] = await fetchIndicators();

    expect(indicator).toMatchObject({ id: 'iep', source: 'INBIO' });
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/indicators/');
  });

  it('rejects an indicator type it does not know', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 'x', name: 'X', indicator_type: { type: 'gauge' } }]),
    );

    await expect(fetchIndicators()).rejects.toThrow(ZodError);
  });
});
