import type { AnalysisResponse } from '@/lib/api/analysis/schemas';

/**
 * TODO(mock-analysis): the spec's example response, served for every request while
 * `POST /api/analysis/` is not reachable. Delete with the mock branch in `client.ts`.
 */
export const analysisFixture: AnalysisResponse = {
  indicators: [
    {
      id: 'iep',
      category: 'sanitario',
      date: '2026-08-18',
      value: 70,
      values: [
        { label: 'Jun', value: 55, date: '2026-06-18' },
        { label: 'Jul', value: 62, date: '2026-07-18' },
        { label: 'Ago', value: 70, date: '2026-08-18' },
      ],
      display_value: '70 %',
      confidence: 'Alto',
    },
    { id: 'rendimiento', category: 'productivo', value: { p10: 2.49, p50: 2.77, p90: 2.96 } },
    { id: 'resiliencia', category: 'productivo', value: 'Baja' },
  ],
};
