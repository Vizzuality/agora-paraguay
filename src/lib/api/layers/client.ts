import { API_URL, getJson } from '@/lib/api/http';

import { globalLayersResponseSchema, type GlobalLayer } from './schemas';

/** Trailing slash as the backend routes it — without one the API answers 301. */
export const GLOBAL_LAYERS_PATH = '/api/parcels/global_layers/';
export const GLOBAL_LAYER_TILES_PATH = '/api/parcels/global_layer_tiles/';

/**
 * The layer name inside every global layer tile (MapLibre's `source-layer`), as the tiles
 * encode it. A name the tiles lack draws nothing and raises no error.
 */
export const GLOBAL_LAYER_SOURCE_LAYER = 'layer';
/** The deepest zoom the API tiles; MapLibre overzooms these beyond it. */
export const GLOBAL_LAYER_MAX_ZOOM = 14;

/** `GET /api/parcels/global_layers/` — the layers offered over the whole country. */
export async function fetchGlobalLayers(): Promise<GlobalLayer[]> {
  return globalLayersResponseSchema.parse(await getJson(GLOBAL_LAYERS_PATH));
}

/**
 * `GET /api/parcels/global_layer_tiles/{id}/{z}/{x}/{y}.pbf` — a layer as vector tiles,
 * which MapLibre requests per tile in view. MapLibre needs an absolute template, so a
 * same-origin API (no `VITE_API_URL`) takes the page's `origin`. The placeholders stay
 * literal: MapLibre fills in `{z}/{x}/{y}`.
 */
export function globalLayerTilesUrl(id: number, origin: string): string {
  return `${API_URL || origin}${GLOBAL_LAYER_TILES_PATH}${id}/{z}/{x}/{y}.pbf`;
}
