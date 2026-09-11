import { queryOptions } from '@tanstack/react-query';

import { fetchAnalysisOptions, fetchFilters, fetchIndicators } from './client';
import type { IndicatorsParams } from './schemas';

export const metadataQueries = {
  filters: () =>
    queryOptions({
      queryKey: ['metadata', 'filters'] as const,
      queryFn: fetchFilters,
    }),

  indicators: (params: IndicatorsParams = {}) =>
    queryOptions({
      queryKey: ['metadata', 'indicators', params] as const,
      queryFn: () => fetchIndicators(params),
    }),

  /** Option lists behind the analysis hero dropdowns (AGP-29). */
  analysisOptions: () =>
    queryOptions({
      queryKey: ['metadata', 'analysis-options'] as const,
      queryFn: fetchAnalysisOptions,
      // TODO(mock-analysis-options): static fixture, so never stale — goes with the mock.
      staleTime: Infinity,
    }),
};
