import type { Indicators } from '@/lib/api/metadata/schemas';

/**
 * TODO(mock-indicators): the spec's example indicators, served for every riesgo while
 * `GET /api/indicators/` is not reachable. Delete with the mock branch in `client.ts`.
 */
export const indicatorsFixture: Indicators = [
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
    description: 'Lorem ipsum',
    default: true,
    indicator_type: {
      type: 'category',
      value: null,
      categories: ['muy bajo', 'bajo', 'medio', 'alto'],
    },
  },
];
