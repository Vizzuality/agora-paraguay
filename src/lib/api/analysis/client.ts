import { postJson, postText } from '@/lib/api/http';

import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
  SUMMARY_PATH,
  summaryRequestSchema,
  summaryResponseSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisVisibility,
  type SummaryRequest,
  type SummaryResponse,
} from './schemas';

/**
 * POSTs the selected parcels and filters and gets back the indicator values. The request is
 * parsed at the boundary, so contract drift fails here instead of as a 4xx against the API.
 */
export async function runAnalysis(
  visibility: AnalysisVisibility,
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const parsed = analysisRequestSchema.parse(request);

  return analysisResponseSchema.parse(await postJson(analysisPath(visibility), parsed));
}

/** POSTs the selected parcels and gets back the LLM-written summary of their analysis, as Markdown. */
export async function generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
  const parsed = summaryRequestSchema.parse(request);

  return summaryResponseSchema.parse(await postText(SUMMARY_PATH, parsed));
}
