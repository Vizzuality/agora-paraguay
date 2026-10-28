import { getJson } from '@/lib/api/http';

import {
  DEFAULT_CROP,
  filtersSchema,
  indicatorsListResponseSchema,
  type Filters,
  type FiltersParams,
  type Indicators,
  type IndicatorsParams,
} from './schemas';

/*
 * The only module in `metadata/` that knows the endpoints. Everything here is real.
 * `filters/` keeps its trailing slash: without one Django answers 301 to the slashed URL,
 * a redirect on every call.
 */

/** The riesgo the filters are asked for when none is given: the public side. */
const DEFAULT_FILTERS_RIESGO = 'sanitario';

/**
 * `GET /api/parcels/filters/?riesgo={sanitario|productivo}&crop_type={value}` — the
 * filters of that side of the analysis and their values. `riesgo` is mandatory on the
 * wire; sanitario (public) unless asked otherwise. `crop_type` narrows the other filters
 * to the crop picked in the hero; rice unless asked otherwise.
 */
export async function fetchFilters({
  riesgo = DEFAULT_FILTERS_RIESGO,
  crop_type = DEFAULT_CROP,
}: FiltersParams = {}): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/parcels/filters/', { riesgo, crop_type }));
}

/** `GET /api/parcels/indicators?riesgo={sanitario|productivo}` — the indicators of a riesgo and their metadata. */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  return indicatorsListResponseSchema.parse(await getJson('/api/parcels/indicators', params));
}
