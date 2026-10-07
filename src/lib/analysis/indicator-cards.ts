import {
  indicatorReadingSchema,
  type AnalysisParcel,
  type ParcelValue,
} from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators, Riesgo } from '@/lib/api/metadata/schemas';

import { isAreaIndicator } from './area';
import { asReading, isNoReading, readingOf } from './readings';
import {
  categoryAxis,
  categoryClasses,
  classIndexAt,
  isShortRange,
  RANGE_CLASSES,
  widgetFor,
  type ParcelScope,
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

/**
 * The ruler under a classed figure: the classes it is read in and where the reading sits,
 * 0–100. `value` is the number printed over the marker when the marker sits at the exact
 * reading rather than in the middle of a class (the "Categorical and numerical" design).
 */
export type RiskScale = { classes: readonly RiskClass[]; position: number; value?: string };

export type IndicatorCard = {
  id: string;
  /** The indicator's name from the metadata. */
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  /** The figure: the class ("Sin riesgo", "Moderado", "Severo"), the category, or the number. */
  level: string;
  /** The ruler, or `undefined` when the value has no scale to sit on (an open number). */
  scale?: RiskScale;
};

/** One row of the general-info card: the indicator's name and the parcel's text for it. */
export type GeneralInfoRow = {
  id: string;
  label: string;
  /** The metadata's description, behind the label's info icon. */
  description?: string;
  value: string;
};

/**
 * Facts, not risks: text always, open numbers on sanitario (`widgetFor`). The riesgo
 * defaults to sanitario, the page where the general-info card lives.
 */
export function isGeneralInfo(indicator: Indicator, riesgo: Riesgo = 'sanitario'): boolean {
  // A fact is a fact under any scope; the scope only moves the classed types.
  return widgetFor(indicator.indicator_type, { riesgo, scope: 'individual' }) === 'fact';
}

/** Classed indicators (a range, a category read for one parcel): the ones that get a risk card. */
export function isRiskClass(
  indicator: Indicator,
  riesgo: Riesgo = 'sanitario',
  scope: ParcelScope = 'individual',
): boolean {
  return widgetFor(indicator.indicator_type, { riesgo, scope }) === 'ruler';
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
 * reading the metadata cannot place still shows, as "Sin datos". Under the `multiple`
 * scope a category or a short range is counted per class instead (`categoryCountWidgets`)
 * and a long range is binned (`valueHistogramWidgets`), so neither gets a card.
 */
export function indicatorCards(
  parcel: AnalysisParcel | null | undefined,
  indicators: Indicators | undefined,
  riesgo: Riesgo = 'sanitario',
  scope: ParcelScope = 'individual',
): IndicatorCard[] {
  if (!parcel || !indicators) return [];

  return indicators.flatMap((indicator) => {
    // The area is the thumbnail's figure (`area.ts`), not a card.
    if (!isRiskClass(indicator, riesgo, scope) || isAreaIndicator(indicator)) return [];

    const value = readingOf(parcel, indicator.id);

    if (value === undefined) return [];

    return [
      toCard(indicator, value) ?? {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        level: NO_READING,
      },
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

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        value: factText(typed, indicator.unit),
      },
    ];
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
 * its index (the sample encodes classes as codes). Each category but NA is a band of the
 * ruler; the reading sits in the middle of its own. A reading of NA names no class.
 */
function categoryCard(
  indicator: Indicator,
  categories: string[],
  value: string | number,
): IndicatorCard | null {
  const index = categoryIndex(value, categories);

  if (index === undefined) return null;

  const axis = categoryAxis(categories);
  const band = axis.indexOf(categories[index]);

  if (band === -1) return null;

  return {
    id: indicator.id,
    label: indicator.name,
    description: indicator.description,
    level: capitalise(axis[band]),
    scale: {
      classes: categoryClasses(categories),
      position: ((band + 0.5) / axis.length) * 100,
    },
  };
}

/**
 * The category a reading names — by label, or by its index (the sample encodes classes
 * as codes). Labels match by stem: the answer writes "Positivo" and "Medio" where the
 * definition says "Positiva" and "Media", so case, accents and a final gender vowel are
 * ignored ("Muy alto" is "Muy alta").
 */
export function categoryIndex(value: string | number, categories: string[]): number | undefined {
  const code = typeof value === 'number' ? value : Number(value);

  if (Number.isInteger(code)) return code >= 0 && code < categories.length ? code : undefined;

  const wanted = categoryStem(String(value));
  const index = categories.findIndex((category) => categoryStem(category) === wanted);

  return index === -1 ? undefined : index;
}

function categoryStem(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[oa]$/, '');
}

/**
 * Bounded number (`data_quality` 0–100 %, a disease index 0–3), read in the classes of
 * `RANGE_CLASSES`; the figure is the class. On a short range (max up to 10) an integer
 * reading is one of a handful of values, so the marker centres in the class it falls in
 * (the "Categorical individual" design): 1 in Sin riesgo, 2 in Moderado, 3 in Severo. Any
 * other reading — a decimal, or a number on a long range — puts the marker at the exact
 * spot and prints the number over it (the "Categorical and numerical individual" design).
 */
function rangeCard(indicator: Indicator, value: number): IndicatorCard {
  const range = indicator.indicator_type.type === 'range' ? indicator.indicator_type : undefined;
  const classes = RANGE_CLASSES;
  const band = integerBand(value, range, classes.length);
  const scale: RiskScale =
    band === undefined
      ? {
          classes,
          position: scalePosition(value, range),
          value: formatValue(value, undefined),
        }
      : { classes, position: ((band + 0.5) / classes.length) * 100 };
  const { label } = classes[rangeClassIndex(value, range)];

  return {
    id: indicator.id,
    label: indicator.name,
    description: indicator.description,
    level: label,
    scale,
  };
}

type Range = { min: number; max: number };

/**
 * The class (`RANGE_CLASSES`) a number on the range reads as: an integer on a short range
 * by its bin (`integerBand`), anything else by where it sits on the scale. The same
 * reading the ruler prints, so counting parcels per class agrees with each parcel's card.
 */
export function rangeClassIndex(value: number, range: Range | undefined): number {
  return (
    integerBand(value, range, RANGE_CLASSES.length) ??
    classIndexAt(scalePosition(value, range), RANGE_CLASSES.length)
  );
}

/**
 * The class an integer reading of a short range falls in, `undefined` when the reading
 * is a decimal or the range is long. The classes split the range in equal bins whose
 * upper edge belongs to them (0–3 in three: (0,1], (1,2], (2,3]); the minimum itself and
 * anything out of range go to the outer classes.
 */
function integerBand(value: number, range: Range | undefined, count: number): number | undefined {
  if (!range || !isShortRange(range) || !Number.isInteger(value)) return undefined;
  if (range.max === range.min) return 0;

  const band = Math.ceil(((value - range.min) / (range.max - range.min)) * count) - 1;

  return Math.min(count - 1, Math.max(0, band));
}

/** Where a number sits on the indicator's range as 0–100; the range defaults to 0–100. */
function scalePosition(value: number, range: Range | undefined): number {
  const min = range?.min ?? 0;
  const max = range?.max ?? 100;

  if (max === min) return 0;

  return ((value - min) / (max - min)) * 100;
}

/** Units whose readings print as whole numbers: a temperature's decimals say nothing to a grower. */
const INTEGER_UNITS = new Set(['°C']);

function formatValue(value: number, unit: string | null | undefined): string {
  const number = new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: unit && INTEGER_UNITS.has(unit) ? 0 : 2,
  }).format(value);

  return unit ? `${number} ${unit}` : number;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
