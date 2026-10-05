import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { fetchFilters, fetchIndicators } from './client';
import type { FiltersParams, IndicatorsParams } from './schemas';

export const metadataQueries = {
  /**
   * The hero filters for a riesgo and crop. Picking another crop asks again; the previous
   * list stands in meanwhile, so the hero keeps its fields and the analysis its request.
   */
  filters: (params: FiltersParams) =>
    queryOptions({
      queryKey: ['metadata', 'filters', params] as const,
      queryFn: () => fetchFilters(params),
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    }),

  /** The riesgo's indicators, asked once: the list does not depend on the hero filters. */
  indicators: (params: IndicatorsParams) =>
    queryOptions({
      queryKey: ['metadata', 'indicators', params] as const,
      queryFn: () => fetchIndicators(params),
    }),
};
