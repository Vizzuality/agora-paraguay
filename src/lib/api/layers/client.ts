import { getJson } from '@/lib/api/http';

import { globalLayersResponseSchema, type GlobalLayer } from './schemas';

/** Trailing slash as Django routes it — without one the API answers 301. */
export const GLOBAL_LAYERS_PATH = '/api/parcels/global_layers/';

/** `GET /api/parcels/global_layers/` — the layers offered over the whole country. */
export async function fetchGlobalLayers(): Promise<GlobalLayer[]> {
  return globalLayersResponseSchema.parse(await getJson(GLOBAL_LAYERS_PATH));
}
