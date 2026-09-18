import { queryOptions } from '@tanstack/react-query';

import { fetchFilters, fetchIndicators } from './client';
import type { FiltersParams, IndicatorsParams } from './schemas';

export const metadataQueries = {
  /** The analysis hero dropdowns. Value lists barely change: no refetch when the tab regains focus. */
  filters: (params: FiltersParams) =>
    queryOptions({
      queryKey: ['metadata', 'filters', params] as const,
      queryFn: () => fetchFilters(params),
      staleTime: 5 * 60 * 1000,
    }),

  indicators: (params: IndicatorsParams) =>
    queryOptions({
      queryKey: ['metadata', 'indicators', params] as const,
      queryFn: () => fetchIndicators(params),
    }),
};
