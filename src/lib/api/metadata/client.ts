import { getJson } from '@/lib/api/http';

import {
  filtersSchema,
  indicatorsListResponseSchema,
  type Filters,
  type FiltersParams,
  type Indicators,
  type IndicatorsParams,
} from './schemas';

/* The only module in `metadata/` that knows the endpoints. Everything here is real. */

/**
 * `GET /api/parcels/filters/?visibility={public|private}` — the filters of that side of
 * the analysis and their values.
 */
export async function fetchFilters(params: FiltersParams): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/parcels/filters/', params));
}

/**
 * Our own server, not the API: `GET /api/parcels/indicators/` wants `{ riesgo }` as a JSON
 * body, which no browser can send on a GET. The server route (`src/routes/relay/`) sends
 * it for us and relays the answer.
 */
const INDICATORS_PATH = '/relay/indicators';

/** `GET /relay/indicators?riesgo={sanitario|productivo}` — the indicators of a riesgo and their metadata. */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  return indicatorsListResponseSchema.parse(await getJson(INDICATORS_PATH, params));
}
