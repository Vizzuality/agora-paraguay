import { postJson } from '@/lib/api/http';

import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisVisibility,
} from './schemas';

/**
 * POSTs the selected parcels and filters and gets back the indicator values. Real in both
 * modes — the endpoint is live (checked 2026-09-18). The request is parsed at the
 * boundary, so contract drift fails here instead of as a 4xx against the API.
 */
export async function runAnalysis(
  visibility: AnalysisVisibility,
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const parsed = analysisRequestSchema.parse(request);

  return analysisResponseSchema.parse(await postJson(analysisPath(visibility), parsed));
}
