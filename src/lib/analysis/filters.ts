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
 * How the hero lays the filters out: the sowing date, then the date it must come before
 * (productivo's is the `year`), then the crop.
 */
const HERO_FILTER_ORDER = [SOWING_DATE_FILTER_ID, DATE_FILTER_ID, 'year', CROP_FILTER_ID];

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

/** An ISO `YYYY-MM-DD` date as local midnight of that calendar day. */
export function isoToDate(iso: string, offsetDays = 0): Date {
  const [year, month, day] = iso.split('-').map(Number);

  return new Date(year, month - 1, day + offsetDays);
}

/** The calendar day before an ISO `YYYY-MM-DD` date. */
export function dayBefore(iso: string): string {
  return todayIso(isoToDate(iso, -1));
}

/** The earliest day any date field accepts: the first with analysis data. */
export const MIN_ANALYSIS_DATE = '2024-09-01';

/** The standard sowing date for both crops in Paraguay. */
export const DEFAULT_SOWING_DATE = '2026-10-01';

/** A date field's default, ours over the API's: the analysis needs the last 72 h observed. */
function dateDefault(filterId: string, apiDefault: string | null | undefined): string {
  if (filterId === SOWING_DATE_FILTER_ID) return DEFAULT_SOWING_DATE;
  if (filterId === DATE_FILTER_ID) return dayBefore(todayIso());

  return apiDefault ?? todayIso();
}

/** `iso` moved into the range every date field accepts, `MIN_ANALYSIS_DATE` to today. */
function withinRange(iso: string): string {
  const today = todayIso();

  if (iso < MIN_ANALYSIS_DATE) return MIN_ANALYSIS_DATE;

  return iso > today ? today : iso;
}

/** The days a date field offers: from `MIN_ANALYSIS_DATE`, the sowing date up to the day before the date. */
export function dateBounds(
  filterId: string,
  resolved: Record<string, string>,
): { min: string; max: string } {
  const date = resolved[DATE_FILTER_ID];
  const max = filterId === SOWING_DATE_FILTER_ID && date ? dayBefore(date) : todayIso();

  return { min: MIN_ANALYSIS_DATE, max };
}

/**
 * Every filter resolved to what the hero displays and Analizar sends. A category keeps a
 * pick still among its options, else takes the first one (the crop `DEFAULT_CROP` when
 * offered). A date keeps whatever was typed, else its default (`dateDefault`), moved into
 * the accepted range; then a sowing date on or after the date moves to the day before it.
 * A category with no options is left out, so the request omits it.
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
        const value = pick ?? dateDefault(filter.id, field.default);

        if (value !== '') resolved[filter.id] = withinRange(value);
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
