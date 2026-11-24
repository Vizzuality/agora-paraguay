import { postJson, postText } from '@/lib/api/http';

import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
  mergeAnalysisResponses,
  SUMMARY_PATH,
  summaryRequestSchema,
  summaryResponseSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisVisibility,
  type SummaryRequest,
  type SummaryResponse,
  withRequestedParcelIds,
} from './schemas';

/**
 * POSTs the selected parcels and filters and gets back the indicator values. The request is
 * parsed at the boundary, so contract drift fails here instead of as a 4xx against the API.
 */
export async function runAnalysis(
  visibility: AnalysisVisibility,
  request: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const parsed = analysisRequestSchema.parse(request);
  const raw = await postJson(analysisPath(visibility), parsed, { signal });

  return analysisResponseSchema.parse(withRequestedParcelIds(raw, request.parcels));
}

/** Runs every request of one selection side by side and merges the answers per parcel. */
export async function runAnalyses(
  visibility: AnalysisVisibility,
  requests: AnalysisRequest[],
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const responses = await Promise.all(
    requests.map((request) => runAnalysis(visibility, request, signal)),
  );

  return mergeAnalysisResponses(responses);
}

/** POSTs the selected parcels and gets back the LLM-written summary of their analysis, as Markdown. */
export async function generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
  const parsed = summaryRequestSchema.parse(request);

  return summaryResponseSchema.parse(await postText(SUMMARY_PATH, parsed));
}
