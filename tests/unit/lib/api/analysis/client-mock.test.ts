import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyzeSelection, runAnalysis } from '@/lib/api/analysis/client';
import { analysisFixture } from '@/lib/api/analysis/fixtures/analysis';
import { analysisResponseSchema } from '@/lib/api/analysis/schemas';

/** Mock branch — `VITE_USE_MOCK_API` is pinned to true in `vitest.config.ts`. */
describe('runAnalysis (mock)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the mocked parcels without touching the network', async () => {
    const request = {
      parcel_ids: [8668],
      filters: { start_date: '2026-06-18', end_date: '2026-08-18', indicators: ['asian_rust'] },
    };

    await expect(runAnalysis('public', request)).resolves.toEqual(analysisFixture);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the fixture honest against the response contract', () => {
    expect(() => analysisResponseSchema.parse(analysisFixture)).not.toThrow();
  });

  it('runs the Analizar chain with the indicators from the API and the analysis mocked', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 'asian_rust', name: 'Phakopsora pachyrhizi', default: true }]),
    );

    const result = await analyzeSelection({
      visibility: 'public',
      polygons: [],
      parcels: [
        {
          type: 'Feature',
          properties: { id: 'parcel-3', name: 'Parcela 3' },
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
      filters: {
        fechaSiembra: '2026-06-18',
        fechaAnalisis: '2026-08-18',
        cultivo: 'soja',
        ciclo: 'zafra',
        fechaInicio: '2010-01-01',
        fechaFin: '2025-12-31',
      },
    });

    expect(result).toEqual(analysisFixture);
    // Only the indicators hit the network: nothing drawn skips filter_parcels, the
    // analysis itself is still the fixture.
    expect(fetchMock.mock.calls.map(([input, init]) => `${init?.method} ${input}`)).toEqual([
      'GET /api/analysis/public?cultivo=soja',
    ]);
  });
});
