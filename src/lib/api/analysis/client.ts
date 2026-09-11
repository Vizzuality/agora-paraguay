import { env } from '@/env';
import type { ResolvedAnalysisFilters } from '@/lib/analysis/filters';
import {
  defaultIndicatorIds,
  parcelIdOf,
  riesgoOf,
  toAnalysisRequest,
} from '@/lib/analysis/request';
import { postJson } from '@/lib/api/http';
import { fetchIndicators } from '@/lib/api/metadata/client';
import { filterParcels } from '@/lib/api/parcels/client';
import { toFilterParcelsRequest, type ParcelFeature } from '@/lib/api/parcels/schemas';
import type { DrawnPolygon } from '@/lib/map/draw-features';

import {
  analysisRequestSchema,
  analysisResponseSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisVisibility,
} from './schemas';

/** `/api/analysis/[path_public_private]` in the spec; the segment is the visibility. */
export function analysisPath(visibility: AnalysisVisibility): string {
  return `/api/analysis/${visibility}`;
}

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
  /** Drawn or uploaded areas: resolved to parcels through `filter_parcels` first. */
  polygons: DrawnPolygon[];
  /** Cadastral parcels clicked on the map: already parcels, sent as they are. */
  parcels: ParcelFeature[];
  filters: ResolvedAnalysisFilters;
};

/**
 * What Analizar does, as one chain: the indicators for the riesgo, the parcels the
 * polygons select (skipped when nothing was drawn), then the analysis itself. The
 * indicators and parcel calls run in parallel; the analysis waits for both.
 */
export async function analyzeSelection(
  variables: AnalyzeSelectionVariables,
): Promise<AnalysisResponse> {
  const { visibility, polygons, parcels, filters } = variables;
  const riesgo = riesgoOf(visibility);

  const [indicators, filtered] = await Promise.all([
    fetchIndicators(riesgo === 'sanitario' ? { riesgo, cultivo: filters.cultivo } : { riesgo }),
    polygons.length > 0 ? filterParcels(toFilterParcelsRequest(polygons)) : null,
  ]);

  const parcelIds = [
    ...(filtered?.results.filter((parcel) => parcel.selected).map((parcel) => parcel.parcel_id) ??
      []),
    ...parcels.map(parcelIdOf),
  ];

  return runAnalysis(
    visibility,
    toAnalysisRequest(visibility, parcelIds, filters, defaultIndicatorIds(indicators)),
  );
}
