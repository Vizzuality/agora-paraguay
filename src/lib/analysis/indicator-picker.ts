import { isAreaIndicator } from '@/lib/analysis/area';
import { isGeneralInfo } from '@/lib/analysis/indicator-cards';
import { projectionCrop } from '@/lib/analysis/projection';
import type { Indicator, Indicators, IndicatorsRiesgo } from '@/lib/api/metadata/schemas';
import { INDICATOR_CATEGORY_TITLES, PROJECTION_TEXT } from '@/lib/platform-metadata';

/*
 * Personalizar indicadores: which indicators the analysis page shows. Pure, node-tested.
 * The user's selection lives in `src/store/analysis.ts`; `null` there means "the API's
 * defaults", so a metadata change is followed until the user touches the list.
 */

/**
 * What the picker offers: the measured indicators only. The general-info facts (station,
 * crop, phenology — and on sanitario the station's numbers) and the area are always on
 * the page and never in the list.
 */
export function selectableIndicators(
  indicators: Indicators,
  riesgo: IndicatorsRiesgo = 'sanitario',
): Indicators {
  return indicators.filter(
    (indicator) => !isGeneralInfo(indicator, riesgo, 'multiple') && !isAreaIndicator(indicator),
  );
}

/** A projection scenario's group, one per crop (`projection_soja`); `null` for any other id. */
function projectionGroup(id: string): string | null {
  const crop = projectionCrop(id);

  return crop === null ? null : `projection_${crop}`;
}

/**
 * The ids with every projection group whole: the chart needs a horizon's three scenarios,
 * so one scenario shown shows its crop's six.
 */
function withWholeGroups(indicators: Indicators, ids: string[]): string[] {
  const groups = new Set(ids.flatMap((id) => projectionGroup(id) ?? []));
  const missing = indicators
    .filter((indicator) => !ids.includes(indicator.id))
    .filter((indicator) => groups.has(projectionGroup(indicator.id) ?? ''))
    .map((indicator) => indicator.id);

  return missing.length > 0 ? [...ids, ...missing] : ids;
}

/**
 * The ids shown: the user's selection, else the indicators the API flags `default`, else
 * all; a projection scenario brings its whole group (`withWholeGroups`).
 */
export function visibleIndicatorIds(indicators: Indicators, selected: string[] | null): string[] {
  if (selected !== null) return withWholeGroups(indicators, selected);

  const defaults = indicators.filter((indicator) => indicator.default === true);

  return withWholeGroups(
    indicators,
    (defaults.length > 0 ? defaults : indicators).map((indicator) => indicator.id),
  );
}

/** The checklist row standing for a crop's six projection scenarios: 3 scenarios × 2 horizons. */
export const PROJECTION_PICKER_NAME = PROJECTION_TEXT.pickerName;

const cropLabel = (crop: string) => crop.charAt(0).toUpperCase() + crop.slice(1);

/** One checklist row: an indicator, or a crop's projection standing for its six scenarios. */
export type PickerEntry = {
  id: string;
  name: string;
  ids: string[];
  /** Whether it reads the past or projects ahead; `null` when the API does not say. */
  category: NonNullable<Indicator['category']> | null;
};

/**
 * The checklist's rows, in metadata order: one per indicator, except each crop's projection
 * scenarios, one row (`PROJECTION_PICKER_NAME`) where its first scenario sits. With two
 * crops' projections listed (Todos), each names its crop.
 */
export function pickerEntries(indicators: Indicators): PickerEntry[] {
  const crops = new Set(indicators.flatMap((indicator) => projectionCrop(indicator.id) ?? []));
  const placed = new Set<string>();

  return indicators.flatMap((indicator): PickerEntry[] => {
    const group = projectionGroup(indicator.id);

    const category = indicator.category ?? null;

    if (group === null) {
      return [{ id: indicator.id, name: indicator.name, ids: [indicator.id], category }];
    }
    if (placed.has(group)) return [];
    placed.add(group);

    const crop = projectionCrop(indicator.id);
    const ids = indicators
      .filter((other) => projectionGroup(other.id) === group)
      .map((other) => other.id);

    return [
      {
        id: group,
        name:
          crops.size > 1 && crop !== null
            ? `${PROJECTION_PICKER_NAME} (${cropLabel(crop)})`
            : PROJECTION_PICKER_NAME,
        ids,
        category,
      },
    ];
  });
}

/** A run of checklist rows under its category's title; the uncategorised run goes untitled. */
export type PickerSection = { key: string; title: string | null; entries: PickerEntry[] };

/**
 * The rows grouped as the widgets page groups its cards: uncategorised first, then the
 * historic, then the projected, each in metadata order. Empty runs are dropped, so a list
 * with no categories (sanitario) is one untitled run.
 */
export function pickerSections(entries: PickerEntry[]): PickerSection[] {
  const runs: PickerSection[] = [
    { key: 'none', title: null, entries: entries.filter(({ category }) => category === null) },
    {
      key: 'historic',
      title: INDICATOR_CATEGORY_TITLES.historic,
      entries: entries.filter(({ category }) => category === 'historic'),
    },
    {
      key: 'future',
      title: INDICATOR_CATEGORY_TITLES.future,
      entries: entries.filter(({ category }) => category === 'future'),
    },
  ];

  return runs.filter((run) => run.entries.length > 0);
}

/** The indicators to render, in metadata order, restricted to the visible ids. */
export function visibleIndicators(indicators: Indicators, selected: string[] | null): Indicators {
  const visible = new Set(visibleIndicatorIds(indicators, selected));

  return indicators.filter((indicator) => visible.has(indicator.id));
}

/**
 * Adds or removes `ids` together from the visible ids — a checklist row's indicators —
 * materialising the defaults on the first toggle. All shown, they all go; else all come.
 */
export function toggleIndicatorIds(
  indicators: Indicators,
  selected: string[] | null,
  ids: string[],
): string[] {
  const current = visibleIndicatorIds(indicators, selected);

  return ids.every((id) => current.includes(id))
    ? current.filter((other) => !ids.includes(other))
    : [...current, ...ids.filter((id) => !current.includes(id))];
}

/** `toggleIndicatorIds` for one indicator. */
export function toggleIndicatorId(
  indicators: Indicators,
  selected: string[] | null,
  id: string,
): string[] {
  return toggleIndicatorIds(indicators, selected, [id]);
}

/**
 * Whether the search box text matches the indicator: a substring of its name or id,
 * ignoring case and accents so "asiatica" finds "Roya asiática". Blank matches all.
 */
export function matchesIndicator(
  indicator: Pick<Indicator, 'id' | 'name'>,
  query: string,
): boolean {
  const needle = fold(query);

  return (
    needle === '' || fold(indicator.name).includes(needle) || fold(indicator.id).includes(needle)
  );
}

/** Lower-case, accents stripped, trimmed — the comparison form for search. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
