import { API_URL, getJson } from '@/lib/api/http';

import { globalLayersResponseSchema, type GlobalLayer } from './schemas';

/** Trailing slash as Django routes it — without one the API answers 301. */
export const GLOBAL_LAYERS_PATH = '/api/parcels/global_layers/';
export const GLOBAL_LAYER_VECTOR_PATH = '/api/parcels/global_layer_vector/';

/** `GET /api/parcels/global_layers/` — the layers offered over the whole country. */
export async function fetchGlobalLayers(): Promise<GlobalLayer[]> {
  return globalLayersResponseSchema.parse(await getJson(GLOBAL_LAYERS_PATH));
}

/**
 * `GET /api/parcels/global_layer_vector/?id={id}` — a layer's features as GeoJSON. Tens
 * of megabytes, so the app never fetches it: MapLibre loads this URL itself and parses
 * it in its worker, off the main thread and outside the query cache.
 */
export function globalLayerVectorUrl(id: number): string {
  return `${API_URL}${GLOBAL_LAYER_VECTOR_PATH}?${new URLSearchParams({ id: String(id) })}`;
}
