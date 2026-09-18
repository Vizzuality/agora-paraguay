import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators } from '@/lib/api/metadata/schemas';

/*
 * From one analysed parcel to what its `RiskClassCard`s show. Pure, node-tested. The
 * response is one entry per parcel with the indicators as property columns; the names,
 * scales and class labels come from the indicator list (`metadataQueries.indicators`).
 * Cards are per parcel — the
 * hero's parcel tab picks which — never a summary over the set.
 *
 * Text indicators (station, crop, phenology) are not risks: they go together into the
 * general-info card (`generalInfo`), the measured ones into one risk card each.
 */

export type IndicatorCard = {
  id: string;
  /** The indicator's name from the metadata. */
  label: string;
  /** The figure: the class ("Bajo", "Medio", "Alto"), the category, or the number. */
  level: string;
  /** 0–100 along the ruler, or `undefined` when the value has no scale to sit on. */
  position?: number;
  /** Qualifies the figure: the measured value with its unit. */
  caption?: string;
};

/** Where Medio and Alto start on the 0–100 ruler. The product's boundaries, not the API's. */
const MEDIO_FROM = 33;
const ALTO_FROM = 66;

/** The class a 0–100 position falls in. */
export function levelOf(position: number): string {
  if (position >= ALTO_FROM) return 'Alto';
  if (position >= MEDIO_FROM) return 'Medio';
  return 'Bajo';
}

/** The ruler's colour band for a position — the same thirds as `levelOf`, named for CSS. */
export type RiskTone = 'low' | 'medium' | 'high';

export function toneOf(position: number): RiskTone {
  if (position >= ALTO_FROM) return 'high';
  if (position >= MEDIO_FROM) return 'medium';
  return 'low';
}

/** The backend writes this where a parcel has no reading for an indicator. */
const NOT_AVAILABLE = 'NA';

/** One row of the general-info card: the indicator's name and the parcel's text for it. */
export type GeneralInfoRow = {
  id: string;
  label: string;
  value: string;
};

/** Text indicators, and untyped ones: nothing to class, so they read as plain facts. */
export function isGeneralInfo(indicator: Indicator): boolean {
  const type = indicator.indicator_type?.type;

  return type === undefined || type === 'text';
}

/**
 * The parcel's value for the indicator, or `undefined` when it has no reading. The exact
 * id first; failing that, the column that matches it ignoring case — the backend answers
 * `Asian_rust` to a request for `asian_rust`.
 */
function readingOf(parcel: AnalysisParcel, indicator: Indicator): string | number | undefined {
  const value = parcel.properties[indicator.id] ?? columnIgnoringCase(parcel, indicator.id);

  if (value === null || value === undefined || value === '' || value === NOT_AVAILABLE) {
    return undefined;
  }

  return value;
}

function columnIgnoringCase(
  parcel: AnalysisParcel,
  id: string,
): string | number | null | undefined {
  const wanted = id.toLowerCase();
  const key = Object.keys(parcel.properties).find((column) => column.toLowerCase() === wanted);

  return key === undefined ? undefined : parcel.properties[key];
}

/** The figure when the parcel's reading exists but the metadata cannot place it. */
export const NO_READING = 'Sin datos';

/**
 * One risk card per measured indicator the response carries (range, category, numeric),
 * in metadata order. The response decides what is shown: an indicator the backend did not
 * answer (missing column, blank, null, "NA") gets no card, however it was requested. A
 * reading the metadata cannot place still shows, as "Sin datos". Columns the metadata
 * does not know come last, as plain figures under their own column name.
 */
export function indicatorCards(
  parcel: AnalysisParcel | null | undefined,
  indicators: Indicators | undefined,
): IndicatorCard[] {
  if (!parcel || !indicators) return [];

  const known = indicators.flatMap((indicator) => {
    if (isGeneralInfo(indicator)) return [];

    const value = readingOf(parcel, indicator);

    if (value === undefined) return [];

    return [
      toCard(indicator, value) ?? { id: indicator.id, label: indicator.name, level: NO_READING },
    ];
  });

  const unknown = unknownColumns(parcel, indicators).flatMap(([column, value]) =>
    typeof value === 'number' || !Number.isNaN(Number(value))
      ? [{ id: column, label: column, level: formatValue(Number(value), undefined) }]
      : [],
  );

  return [...known, ...unknown];
}

/**
 * The text indicators the parcel carries, in metadata order, for the general-info card;
 * then any text column the metadata does not know, under its own column name.
 */
export function generalInfo(
  parcel: AnalysisParcel | null | undefined,
  indicators: Indicators | undefined,
): GeneralInfoRow[] {
  if (!parcel || !indicators) return [];

  const known = indicators.flatMap((indicator) => {
    if (!isGeneralInfo(indicator)) return [];

    const value = readingOf(parcel, indicator);

    return value === undefined
      ? []
      : [{ id: indicator.id, label: indicator.name, value: String(value) }];
  });

  const unknown = unknownColumns(parcel, indicators).flatMap(([column, value]) =>
    typeof value === 'string' && Number.isNaN(Number(value))
      ? [{ id: column, label: column, value }]
      : [],
  );

  return [...known, ...unknown];
}

/** The parcel's readable columns no indicator in the metadata claims, ignoring case. */
function unknownColumns(
  parcel: AnalysisParcel,
  indicators: Indicators,
): [string, string | number][] {
  const claimed = new Set(indicators.map((indicator) => indicator.id.toLowerCase()));

  return Object.entries(parcel.properties).flatMap(([column, value]) => {
    if (claimed.has(column.toLowerCase())) return [];
    if (value === null || value === '' || value === NOT_AVAILABLE) return [];

    return [[column, value] as [string, string | number]];
  });
}

function toCard(indicator: Indicator, value: string | number): IndicatorCard | null {
  const type = indicator.indicator_type;

  switch (type?.type) {
    case 'category':
      return categoryCard(indicator, type.categories, value);
    case 'range':
      return rangeCard(indicator, value);
    case 'numeric':
      return numericCard(indicator, value);
    default:
      return null;
  }
}

/**
 * Categorical indicator: the value names one of the ordered categories, by label or by
 * its index (the sample encodes classes as codes). The ruler places it among them,
 * first at 0 and last at 100.
 */
function categoryCard(
  indicator: Indicator,
  categories: string[],
  value: string | number,
): IndicatorCard | null {
  const index = classIndex(value, categories);

  if (index === undefined) return null;

  return {
    id: indicator.id,
    label: indicator.name,
    level: capitalise(categories[index]),
    position: categories.length > 1 ? (index / (categories.length - 1)) * 100 : undefined,
  };
}

function classIndex(value: string | number, categories: string[]): number | undefined {
  const code = typeof value === 'number' ? value : Number(value);

  if (Number.isInteger(code)) return code >= 0 && code < categories.length ? code : undefined;

  const index = categories.findIndex(
    (category) => category.toLowerCase() === String(value).trim().toLowerCase(),
  );

  return index === -1 ? undefined : index;
}

/**
 * Bounded number (`data_quality` 0–100 %, a disease index 1–3): placed on the range and
 * classed by `levelOf`, the value itself as caption.
 */
function rangeCard(indicator: Indicator, value: string | number): IndicatorCard | null {
  const number = Number(value);

  if (Number.isNaN(number)) return null;

  const position = scalePosition(number, indicator);

  return {
    id: indicator.id,
    label: indicator.name,
    level: levelOf(position),
    position,
    caption: formatValue(number, indicator.unit),
  };
}

/** Open number (`Pro_soja` t/ha): no scale to class it on, so the value is the figure. */
function numericCard(indicator: Indicator, value: string | number): IndicatorCard | null {
  const number = Number(value);

  if (Number.isNaN(number)) return null;

  return { id: indicator.id, label: indicator.name, level: formatValue(number, indicator.unit) };
}

/** Where a number sits on the indicator's range as 0–100. */
function scalePosition(value: number, indicator: Indicator): number {
  const range = indicator.indicator_type?.type === 'range' ? indicator.indicator_type : undefined;
  const min = range?.min ?? 0;
  const max = range?.max ?? 100;

  if (max === min) return 0;

  return ((value - min) / (max - min)) * 100;
}

function formatValue(value: number, unit: string | undefined): string {
  const number = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);

  return unit ? `${number} ${unit}` : number;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
