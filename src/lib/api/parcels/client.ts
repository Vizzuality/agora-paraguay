import { API_URL, postJson } from '@/lib/api/http';

import {
  filterParcelsRequestSchema,
  filterParcelsResponseSchema,
  type FilterParcelsRequest,
  type FilterParcelsResponse,
} from './schemas';

/*
 * Parcels are real: `filter-parcels/` is live (Django route `filter-features`). The
 * disease scoring lives in `analysis/`.
 */

/** Trailing slash as Django routes it — without one the API answers 301. */
export const FILTER_PARCELS_PATH = '/api/parcels/filter-parcels/';

/**
 * POSTs the drawn or uploaded polygons and gets back the cadastral parcels around them,
 * with the ones over the overlap threshold flagged. The request is parsed at the
 * boundary, so a body the backend would reject fails here.
 */
export async function filterParcels(request: FilterParcelsRequest): Promise<FilterParcelsResponse> {
  const parsed = filterParcelsRequestSchema.parse(request);

  return filterParcelsResponseSchema.parse(await postJson(FILTER_PARCELS_PATH, parsed));
}

/** Trailing slash as Django routes it — without one the API answers 301. */
export const GLOBAL_LAYER_VECTOR_PATH = '/api/parcels/global_layer_vector/';

/**
 * `GET /api/parcels/global_layer_vector/?id={id}` — a reference layer as GeoJSON. Only the
 * URL leaves here: a layer runs to hundreds of MB, so MapLibre fetches and parses it in
 * its worker instead of the main thread going through `getJson` and Zod.
 */
export function globalLayerVectorUrl(id: number): string {
  return `${API_URL}${GLOBAL_LAYER_VECTOR_PATH}?${new URLSearchParams({ id: String(id) })}`;
}
