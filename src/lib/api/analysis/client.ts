import { env } from '@/env';
import type { ResolvedAnalysisFilters } from '@/lib/analysis/filters';
import { defaultIndicatorIds, riesgoOf, toAnalysisRequest } from '@/lib/analysis/request';
import { postJson } from '@/lib/api/http';
import { fetchIndicators } from '@/lib/api/metadata/client';

import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisVisibility,
} from './schemas';

/**
 * POSTs the selected parcels and filters and gets back the indicator values. The
 * request is parsed at the boundary in both branches, so contract drift fails here
 * instead of as a 4xx against the API.
 *
 * TODO(mock-analysis): the mock branch answers the spec's example for any request;
 * drop it when the endpoint is reachable (grep `mock-analysis`).
 */
export async function runAnalysis(
  visibility: AnalysisVisibility,
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const parsed = analysisRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    const { analysisFixture } = await import('./fixtures/analysis');

    return analysisResponseSchema.parse(analysisFixture);
  }

  return analysisResponseSchema.parse(await postJson(analysisPath(visibility), parsed));
}

export type AnalyzeSelectionVariables = {
  visibility: AnalysisVisibility;
  /**
   * The parcels flagged `selected` by `filter_parcels`, which already ran when the
   * drawing finished or the upload landed (`parcelQueries.filtered`).
   */
  parcelIds: number[];
  filters: ResolvedAnalysisFilters;
};

/**
 * What Analizar does: the indicators for the riesgo, then the analysis over the parcels
 * the selection step already resolved. An empty parcel list fails the request parse
 * before anything is POSTed.
 */
export async function analyzeSelection(
  variables: AnalyzeSelectionVariables,
): Promise<AnalysisResponse> {
  const { visibility, parcelIds, filters } = variables;
  const riesgo = riesgoOf(visibility);

  const indicators = await fetchIndicators(
    riesgo === 'sanitario' ? { riesgo, cultivo: filters.cultivo } : { riesgo },
  );

  return runAnalysis(
    visibility,
    toAnalysisRequest(visibility, parcelIds, filters, defaultIndicatorIds(indicators)),
  );
}
