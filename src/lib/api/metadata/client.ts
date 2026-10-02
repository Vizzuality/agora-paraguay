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

/** The riesgo the filters are asked for when none is given: the public side. */
const DEFAULT_FILTERS_RIESGO = 'sanitario';

/**
 * `GET /api/parcels/filters/?riesgo={sanitario|productivo}` — the filters of that side of
 * the analysis and their values. `riesgo` is mandatory on the wire; sanitario (public)
 * unless asked otherwise.
 */
export async function fetchFilters({
  riesgo = DEFAULT_FILTERS_RIESGO,
}: FiltersParams = {}): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/parcels/filters/', { riesgo }));
}

/** `GET /api/parcels/indicators?riesgo={sanitario|productivo}` — the indicators of a riesgo and their metadata. */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  return indicatorsListResponseSchema.parse(await getJson('/api/parcels/indicators', params));
}
