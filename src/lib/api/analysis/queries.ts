import { keepPreviousData, queryOptions, skipToken } from '@tanstack/react-query';

import { runAnalysis } from './client';
import type { AnalysisRequest, AnalysisVisibility } from './schemas';

export const analysisQueries = {
  /**
   * The analysis over the given parcels, filters and indicators. A query although it is
   * a POST: the answer is a function of the request, so it is keyed by it — a change in
   * the hero dropdowns or in Personalizar indicadores changes the key and re-runs it, and
   * the cards keep the previous answer on screen until the new one lands. `null` while
   * the inputs are still loading (`skipToken`, nothing is sent).
   */
  result: (visibility: AnalysisVisibility, request: AnalysisRequest | null) =>
    queryOptions({
      queryKey: ['analysis', visibility, request] as const,
      queryFn: request === null ? skipToken : () => runAnalysis(visibility, request),
      staleTime: Infinity,
      placeholderData: keepPreviousData,
    }),
};
