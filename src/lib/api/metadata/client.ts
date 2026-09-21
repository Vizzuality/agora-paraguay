import { visibilityOf } from '@/lib/analysis/request';
import { analysisPath } from '@/lib/api/analysis/schemas';
import { getJson, postJson } from '@/lib/api/http';

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
 * `POST /api/parcels/analysis/{diseases|production}/` with no parcels — the indicators
 * of a riesgo and their metadata. Same path the analysis POSTs to; with `parcel_ids`
 * empty it lists what it can score. Body shape is the nested one
 * the backend expects: `parcel_ids` plus a `filters` object.
 */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  const body = {
    parcel_ids: [],
    filters: params.cultivo === undefined ? {} : { crop: params.cultivo },
  };

  return indicatorsListResponseSchema.parse(
    await postJson(analysisPath(visibilityOf(params.riesgo)), body),
  );
}
