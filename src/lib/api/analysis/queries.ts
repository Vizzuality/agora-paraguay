import { mutationOptions } from '@tanstack/react-query';

import { analyzeSelection, runAnalysis, type AnalyzeSelectionVariables } from './client';
import type { AnalysisRequest, AnalysisVisibility } from './schemas';

/** Mutations, not queries: explicit POSTs the user triggers, never refetched on focus. */
export const analysisMutations = {
  /** The raw endpoint, for callers that already hold `parcel_ids`. */
  run: (visibility: AnalysisVisibility) =>
    mutationOptions({
      mutationKey: ['analysis', 'run', visibility] as const,
      mutationFn: (request: AnalysisRequest) => runAnalysis(visibility, request),
    }),

  /** Analizar: from the areas on the map and the hero filters to the indicator values. */
  analyzeSelection: () =>
    mutationOptions({
      mutationKey: ['analysis', 'selection'] as const,
      mutationFn: (variables: AnalyzeSelectionVariables) => analyzeSelection(variables),
    }),
};
