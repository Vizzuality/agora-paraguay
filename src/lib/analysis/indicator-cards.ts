import {
  indicatorReadingSchema,
  type AnalysisParcel,
  type ParcelValue,
} from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators, Riesgo } from '@/lib/api/metadata/schemas';

import { isAreaIndicator } from './area';
import { asReading, isNoReading, readingOf } from './readings';
import {
  categoryClasses,
  classIndexAt,
  RANGE_CLASSES,
  widgetKindOf,
  type RiskClass,
} from './widget-config';

/*
 * From one analysed parcel to what its `RiskClassCard`s show. Pure, node-tested. The
 * response is one entry per parcel with the indicators as property columns; the names,
 * scales and class labels come from the indicator list (`metadataQueries.indicators`).
 * Cards are per parcel — the hero's parcel tab picks which. The Todas tab shows the same
 * cards over a synthetic parcel that combines the set (`combinedParcel`).
 *
 * Text and open-number indicators (station, crop, phenology, a yield in t/ha) are not
 * risks: they go together into the general-info card (`generalInfo`), the classed ones
 * (range, category) into one risk card each.
 */

/** The `parcel_id` of the parcel `combinedParcel` builds — never a cadastral id. */
export const COMBINED_PARCEL_ID = 'todas';

/**
 * One parcel standing for the whole set, for the Todas tab: each column combined over the
 * parcels that carry a reading for it. Range and open numbers average; a category is the
 * most frequent one (first wins a tie); text lists the distinct values. Columns the
 * metadata does not know follow the same rule by the shape of their values: numbers
 * average, strings list. `null` for an empty set.
 */
export function combinedParcel(
  parcels: AnalysisParcel[],
  indicators: Indicators | undefined,
): AnalysisParcel | null {
  if (parcels.length === 0) return null;

  const typeOf = new Map(
    (indicators ?? []).map((indicator) => [
      indicator.id.toLowerCase(),
      indicator.indicator_type.type,
    ]),
  );
  const columns = new Set(parcels.flatMap((parcel) => Object.keys(parcel.properties)));
  const properties: Record<string, ParcelValue> = {};

  for (const column of columns) {
    const readings = parcels.flatMap((parcel) => {
      const reading = asReading(parcel.properties[column]);

      return reading === undefined ? [] : [reading];
    });

    if (readings.length === 0) continue;

    properties[column] = combineReadings(readings, typeOf.get(column.toLowerCase()));
  }

  return { parcel_id: COMBINED_PARCEL_ID, properties };
}

function combineReadings(readings: (string | number)[], type: string | undefined): ParcelValue {
  const numbers = readings.map(Number);
  const numeric = numbers.every((number) => !Number.isNaN(number));

  if (type === 'category' || type === 'text' || !numeric) {
    return type === 'category' ? mostFrequent(readings) : distinctList(readings);
  }

  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function mostFrequent(readings: (string | number)[]): ParcelValue {
  const counts = new Map<string, { value: string | number; count: number }>();

  for (const value of readings) {
    const key = String(value).trim().toLowerCase();
    const entry = counts.get(key) ?? { value, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }

  let best: { value: string | number; count: number } | undefined;

  for (const entry of counts.values()) {
    if (best === undefined || entry.count > best.count) best = entry;
  }

  return best?.value ?? null;
}

function distinctList(readings: (string | number)[]): string {
  return [...new Set(readings.map((value) => String(value).trim()))].join(', ');
}

/** The ruler under a classed figure: the classes it is read in and where the reading sits, 0–100. */
export type RiskScale = { classes: readonly RiskClass[]; position: number };

export type IndicatorCard = {
  id: string;
  /** The indicator's name from the metadata. */
  label: string;
  /** The figure: the class ("Sin riesgo", "Moderado", "Severo"), the category, or the number. */
  level: string;
  /** The ruler, or `undefined` when the value has no scale to sit on (an open number). */
  scale?: RiskScale;
};

/** One row of the general-info card: the indicator's name and the parcel's text for it. */
export type GeneralInfoRow = {
  id: string;
  label: string;
  value: string;
};

/**
 * Facts, not risks: text always, open numbers on sanitario (`widgetKindOf`). The riesgo
 * defaults to sanitario, the page where the general-info card lives.
 */
export function isGeneralInfo(indicator: Indicator, riesgo: Riesgo = 'sanitario'): boolean {
  return widgetKindOf(riesgo, indicator.indicator_type.type) === 'general-info';
}

/** Classed indicators (range, category): the ones that get a risk card. */
export function isRiskClass(indicator: Indicator, riesgo: Riesgo = 'sanitario'): boolean {
  return widgetKindOf(riesgo, indicator.indicator_type.type) === 'risk-class';
}

/**
 * The reading checked against the indicator's type (`indicatorReadingSchema`): a `numeric`
 * column must carry a number, a `text` one a string, and so on. `undefined` when the
 * backend answered something else — the card then reads "Sin datos".
 */
function typedReading(indicator: Indicator, value: string | number): string | number | undefined {
  const parsed = indicatorReadingSchema(indicator.indicator_type).safeParse(value);

  return parsed.success ? parsed.data : undefined;
}

/** The figure when the parcel's reading exists but the metadata cannot place it. */
export const NO_READING = 'Sin datos';

/**
 * One risk card per classed indicator the response carries (range, category), in
 * metadata order. The response decides what is shown: an indicator the backend did not
 * answer (missing column, blank, null, "NA") gets no card, however it was requested. A
 * reading the metadata cannot place still shows, as "Sin datos".
 */
export function indicatorCards(
  parcel: AnalysisParcel | null | undefined,
  indicators: Indicators | undefined,
  riesgo: Riesgo = 'sanitario',
): IndicatorCard[] {
  if (!parcel || !indicators) return [];

  return indicators.flatMap((indicator) => {
    // The area is the thumbnail's figure (`area.ts`), not a card.
    if (!isRiskClass(indicator, riesgo) || isAreaIndicator(indicator)) return [];

    const value = readingOf(parcel, indicator.id);

    if (value === undefined) return [];

    return [
      toCard(indicator, value) ?? { id: indicator.id, label: indicator.name, level: NO_READING },
    ];
  });
}

/**
 * The facts the parcel carries for the general-info card: the text and open-number
 * indicators in metadata order (a number formatted with its unit), then any column the
 * metadata does not know, under its own column name.
 */
export function generalInfo(
  parcel: AnalysisParcel | null | undefined,
  indicators: Indicators | undefined,
  riesgo: Riesgo = 'sanitario',
): GeneralInfoRow[] {
  if (!parcel || !indicators) return [];

  const known = indicators.flatMap((indicator) => {
    if (!isGeneralInfo(indicator, riesgo) || isAreaIndicator(indicator)) return [];

    const value = readingOf(parcel, indicator.id);

    if (value === undefined) return [];

    const typed = typedReading(indicator, value);

    return [{ id: indicator.id, label: indicator.name, value: factText(typed, indicator.unit) }];
  });

  const unknown = unknownColumns(parcel, indicators).map(([column, value]) => ({
    id: column,
    label: column,
    value: factText(value, undefined),
  }));

  return [...known, ...unknown];
}

/** A fact as printed: numbers in the platform's locale with the unit, text as is, "Sin datos" when unreadable. */
function factText(value: string | number | undefined, unit: string | null | undefined): string {
  if (value === undefined) return NO_READING;

  return typeof value === 'number' ? formatValue(value, unit) : value;
}

/** The parcel's readable columns no indicator in the metadata claims, ignoring case. */
function unknownColumns(
  parcel: AnalysisParcel,
  indicators: Indicators,
): [string, string | number][] {
  const claimed = new Set(indicators.map((indicator) => indicator.id.toLowerCase()));

  return Object.entries(parcel.properties).flatMap(([column, value]) => {
    if (claimed.has(column.toLowerCase())) return [];
    if (isNoReading(value)) return [];

    return [[column, value] as [string, string | number]];
  });
}

function toCard(indicator: Indicator, value: string | number): IndicatorCard | null {
  const type = indicator.indicator_type;
  const typed = typedReading(indicator, value);

  if (typed === undefined) return null;

  switch (type.type) {
    case 'category':
      return categoryCard(indicator, type.categories, typed);
    case 'range':
      return rangeCard(indicator, Number(typed));
    default:
      return null;
  }
}

/**
 * Categorical indicator: the value names one of the ordered categories, by label or by
 * its index (the sample encodes classes as codes). Each category is a band of the ruler;
 * the reading sits in the middle of its own. One category alone is no scale.
 */
function categoryCard(
  indicator: Indicator,
  categories: string[],
  value: string | number,
): IndicatorCard | null {
  const index = categoryIndex(value, categories);

  if (index === undefined) return null;

  const card: IndicatorCard = {
    id: indicator.id,
    label: indicator.name,
    level: capitalise(categories[index]),
  };

  if (categories.length > 1) {
    card.scale = {
      classes: categoryClasses(categories),
      position: ((index + 0.5) / categories.length) * 100,
    };
  }

  return card;
}

/** The category a reading names — by label, ignoring case, or by its index (the sample encodes classes as codes). */
export function categoryIndex(value: string | number, categories: string[]): number | undefined {
  const code = typeof value === 'number' ? value : Number(value);

  if (Number.isInteger(code)) return code >= 0 && code < categories.length ? code : undefined;

  const index = categories.findIndex(
    (category) => category.toLowerCase() === String(value).trim().toLowerCase(),
  );

  return index === -1 ? undefined : index;
}

/**
 * Bounded number (`data_quality` 0–100 %, a disease index 1–3): placed on the range and
 * read in the three classes of `RANGE_CLASSES`. The figure is the class, not the number:
 * the design prints no value under the ruler.
 */
function rangeCard(indicator: Indicator, value: number): IndicatorCard {
  const position = scalePosition(value, indicator);
  const { label } = RANGE_CLASSES[classIndexAt(position, RANGE_CLASSES.length)];

  return {
    id: indicator.id,
    label: indicator.name,
    level: label,
    scale: { classes: RANGE_CLASSES, position },
  };
}

/** Where a number sits on the indicator's range as 0–100. */
function scalePosition(value: number, indicator: Indicator): number {
  const range = indicator.indicator_type.type === 'range' ? indicator.indicator_type : undefined;
  const min = range?.min ?? 0;
  const max = range?.max ?? 100;

  if (max === min) return 0;

  return ((value - min) / (max - min)) * 100;
}

function formatValue(value: number, unit: string | null | undefined): string {
  const number = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);

  return unit ? `${number} ${unit}` : number;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
