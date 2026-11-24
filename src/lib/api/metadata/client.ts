import { getJson } from '@/lib/api/http';
import { correctApiDescription, correctApiText } from '@/lib/api/text-corrections';

import {
  DEFAULT_CROP,
  filtersSchema,
  fromWireCrop,
  indicatorsListResponseSchema,
  type Filter,
  type Filters,
  type FiltersParams,
  type Indicator,
  type Indicators,
  type IndicatorsParams,
  toWireCrop,
} from './schemas';

/*
 * The only module in `metadata/` that knows the endpoints. Everything here is real.
 * `filters/` keeps its trailing slash: without one the backend answers 301 to the slashed URL,
 * a redirect on every call.
 */

/** The riesgo the filters are asked for when none is given: the public side. */
const DEFAULT_FILTERS_RIESGO = 'sanitario';

/**
 * `GET /api/parcels/filters/?riesgo={sanitario|productivo}&crop_type={value}` — the
 * filters of that side of the analysis and their values. `riesgo` is mandatory on the
 * wire; sanitario (public) unless asked otherwise. `crop_type` narrows the other filters
 * to the crop picked in the hero; soy unless asked otherwise.
 */
export async function fetchFilters(
  { riesgo = DEFAULT_FILTERS_RIESGO, crop_type = DEFAULT_CROP }: FiltersParams = {},
  signal?: AbortSignal,
): Promise<Filters> {
  const filters = filtersSchema.parse(
    await getJson(
      '/api/parcels/filters/',
      { riesgo, crop_type: toWireCrop(crop_type) },
      { signal },
    ),
  );

  return filters.map(correctFilterText);
}

/** `GET /api/parcels/indicators?riesgo={sanitario|productivo|exposicion_climatica}` — the indicators of a riesgo and their metadata. */
export async function fetchIndicators(
  params: IndicatorsParams,
  signal?: AbortSignal,
): Promise<Indicators> {
  const indicators = indicatorsListResponseSchema.parse(
    await getJson('/api/parcels/indicators', params, { signal }),
  );

  return indicators.map(correctIndicatorText);
}

/**
 * A filter's name, description and option labels as the platform shows them; a crop
 * option's value as the app names the crop (`fromWireCrop`).
 */
function correctFilterText(filter: Filter): Filter {
  const field = filter.field_type;

  return {
    ...filter,
    name: correctApiText(filter.name),
    ...(filter.description !== undefined && {
      description: correctApiDescription(filter.description),
    }),
    field_type:
      field.type === 'category'
        ? {
            ...field,
            options: field.options.map((option) => ({
              ...option,
              value: fromWireCrop(option.value),
              label: correctApiText(option.label),
            })),
          }
        : field,
  };
}

/** An indicator's name and description as the platform shows them. */
function correctIndicatorText(indicator: Indicator): Indicator {
  return {
    ...indicator,
    name: correctApiText(indicator.name),
    ...(indicator.description !== undefined && {
      description: correctApiDescription(indicator.description),
    }),
  };
}
