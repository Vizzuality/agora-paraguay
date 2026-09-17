import type { Filters } from '@/lib/api/metadata/schemas';

/**
 * TODO(mock-filters): stand-in for `GET /api/filters/` while the endpoint is not
 * reachable. Delete with the mock branch in `client.ts`.
 *
 * Mocked data in the spec's two shapes: a list filter and a single-value one.
 */
export const filtersFixture: Filters = [
  {
    id: 'cultivo',
    name: 'Cultivo',
    options: [
      { value: 'soja', label: 'Soja' },
      { value: 'maiz', label: 'Maíz' },
      { value: 'trigo', label: 'Trigo' },
    ],
  },
  { id: 'start-date', name: 'Fecha de inicio', value: '2010-01-01' },
];
