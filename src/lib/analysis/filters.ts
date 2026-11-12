import { DEFAULT_CROP, type Filter, type Filters } from '@/lib/api/metadata/schemas';

/**
 * The analysis hero fields: one per filter `GET /api/parcels/filters/` returns, keyed by
 * the filter's `id`. Nothing here knows which filters exist — the list is the API's.
 */

/** What the user picked or typed, by filter id. A missing id is "untouched": its default comes from the filter. */
export type AnalysisFilterSelection = Record<string, string>;

export const EMPTY_ANALYSIS_FILTERS: AnalysisFilterSelection = {};

/** The hero filter whose value the indicator list is asked for: the crop. */
export const CROP_FILTER_ID = 'crop_type';

/** The two dates the backend checks against each other: sowing must come first. */
export const SOWING_DATE_FILTER_ID = 'sowing_date';
export const DATE_FILTER_ID = 'date';

/**
 * How the hero lays the filters out: the date (productivo's is the `year`), the sowing
 * date, then the crop.
 */
const HERO_FILTER_ORDER = [DATE_FILTER_ID, 'year', SOWING_DATE_FILTER_ID, CROP_FILTER_ID];

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
 * Whether a hero field takes a whole row of the two-column grid: only an odd last one
 * (sanitario's crop after its two dates), so an even set (productivo's year and crop)
 * pairs up.
 */
export function heroFieldSpansRow(index: number, count: number): boolean {
  return count % 2 === 1 && index === count - 1;
}

/** Today as the date inputs write it, `YYYY-MM-DD`, in the user's own calendar day. */
export function todayIso(now: Date = new Date()): string {
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The calendar day before an ISO `YYYY-MM-DD` date. */
export function dayBefore(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);

  return todayIso(new Date(year, month - 1, day - 1));
}

/**
 * Every filter resolved to what the hero displays and Analizar sends. A category keeps a
 * pick still among its options, else takes the first one — the crop takes `DEFAULT_CROP`
 * when offered, so the hero shows the crop the filters were first asked for; a date keeps whatever was typed,
 * else the API's default, else today — so every date always has a value and the analysis
 * never waits on one. A sowing date on or after the date moves to the day before it, since
 * the backend rejects that pair. A category with no options is left out, so the request
 * omits it. Runs on every render against whatever the query returned.
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

        const fallback =
          filter.id === CROP_FILTER_ID && values.includes(DEFAULT_CROP) ? DEFAULT_CROP : values[0];

        if (pick !== undefined && values.includes(pick)) resolved[filter.id] = pick;
        else if (fallback !== undefined) resolved[filter.id] = fallback;
        break;
      }
      case 'date': {
        const value = pick ?? field.default ?? todayIso();

        if (value !== '') resolved[filter.id] = value;
        break;
      }
    }
  }

  return withSowingBeforeDate(resolved);
}

/** Moves a sowing date on or after the date to the day before it; the backend rejects that pair. */
function withSowingBeforeDate(resolved: Record<string, string>): Record<string, string> {
  const sowing = resolved[SOWING_DATE_FILTER_ID];
  const date = resolved[DATE_FILTER_ID];

  if (sowing === undefined || date === undefined || sowing < date) return resolved;

  return { ...resolved, [SOWING_DATE_FILTER_ID]: dayBefore(date) };
}
