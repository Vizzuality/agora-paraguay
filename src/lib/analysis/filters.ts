import type { Filter, Filters } from '@/lib/api/metadata/schemas';

/**
 * The analysis hero fields: one per filter `GET /api/parcels/filters/` returns, keyed by
 * the filter's `id`. Nothing here knows which filters exist — the list is the API's.
 */

/** What the user picked or typed, by filter id. A missing id is "untouched": its default comes from the filter. */
export type AnalysisFilterSelection = Record<string, string>;

export const EMPTY_ANALYSIS_FILTERS: AnalysisFilterSelection = {};

/** The hero filter whose value the indicator list is asked for: the crop. */
export const CROP_FILTER_ID = 'crop_type';

/** How the hero lays the filters out: the date, the sowing date, then the crop. */
const HERO_FILTER_ORDER = ['date', 'sowing_date', CROP_FILTER_ID];

/**
 * The filters in the hero's order rather than the API's: the two dates first, the crop
 * last (it takes the whole row). Anything the API adds beyond those follows, in its order.
 */
export function orderHeroFilters(filters: Filters): Filters {
  const rank = (filter: Filter) => {
    const index = HERO_FILTER_ORDER.indexOf(filter.id);

    return index === -1 ? HERO_FILTER_ORDER.length : index;
  };

  return [...filters].sort((a, b) => rank(a) - rank(b));
}

/**
 * Every filter resolved to what the hero displays and Analizar sends. A category keeps a
 * pick still among its options, else takes the first one; a date keeps whatever was typed,
 * else the API's default. A filter with nothing to show (no options, no default) is left
 * out, so the request omits it. Runs on every render against whatever the query returned.
 */
export function resolveFilterSelection(
  selected: AnalysisFilterSelection,
  filters: Filters,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const filter of filters) {
    const pick = selected[filter.id];
    const field = filter.field_type;

    switch (field.type) {
      case 'category': {
        const values = field.options.map((option) => option.value);

        if (pick !== undefined && values.includes(pick)) resolved[filter.id] = pick;
        else if (values.length > 0) resolved[filter.id] = values[0];
        break;
      }
      case 'date': {
        const value = pick ?? field.default ?? '';

        if (value !== '') resolved[filter.id] = value;
        break;
      }
    }
  }

  return resolved;
}

/**
 * The filters still without a value after `resolveFilterSelection` — a date with no
 * default the user has not typed yet. The backend requires every filter it lists, so the
 * analysis waits for these instead of POSTing into a 400.
 */
export function unresolvedFilters(resolved: Record<string, string>, filters: Filters): Filters {
  return filters.filter((filter) => !(filter.id in resolved));
}

/** Names as Spanish prose: "Fecha de siembra", "Fecha de siembra y Fecha", "A, B y C". */
export function listNames(names: string[]): string {
  return new Intl.ListFormat('es', { type: 'conjunction' }).format(names);
}
