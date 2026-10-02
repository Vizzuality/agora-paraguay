import type { IndicatorType, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * What each indicator type renders as, and how a classed one is read. The analysis
 * answers bare values; the words on the widgets and the bands of the ruler are product
 * decisions, so they live here rather than in the API layer.
 */

/**
 * The ruler band a class paints: blue, grey, orange, red (`--risk-low`, muted,
 * `--risk-medium`, `--risk-high`).
 */
export type RiskTone = 'low' | 'medium' | 'elevated' | 'high';

/** One class an indicator is read in: the word the widget prints and the band it sits on. */
export type RiskClass = { label: string; tone: RiskTone };

/**
 * What an indicator's widget renders: the class ruler, a fact, a row per parcel, the
 * parcels counted per class as bars, or their values binned over the range as a histogram.
 */
export type WidgetKind = 'ruler' | 'fact' | 'parcel-list' | 'bar-chart' | 'histogram';

/** How many parcels a widget reads: one (a parcel tab) or the whole selection (Todas). */
export type ParcelScope = 'individual' | 'multiple';

/** A range this short reads as a handful of values rather than a continuum. */
export const SHORT_RANGE_MAX = 10;

/** Whether the range is a handful of values (a 1–3 disease index) rather than a continuum (0–100 %). */
export function isShortRange(range: { min: number; max: number }): boolean {
  return range.max <= SHORT_RANGE_MAX;
}

/**
 * A classed indicator is read per scope: one parcel gets its class on the ruler, several
 * get counted per class (the "Categorical multiple" design) — a category always, a range
 * on sanitario when it is short. A long range over several parcels bins their values
 * along the scale instead (the "Categorical and numerical multiple" design): counting a
 * 0–100 % quality in three classes would hide where the parcels sit. The other types
 * follow the riesgo: sanitario reads text and open numbers as facts; productivo lists
 * every parcel's number, ranges included — text is a fact on both.
 */
export function widgetFor(
  type: IndicatorType,
  { riesgo, scope }: { riesgo: Riesgo; scope: ParcelScope },
): WidgetKind {
  switch (type.type) {
    case 'range':
      if (riesgo === 'productivo') return 'parcel-list';
      if (scope === 'individual') return 'ruler';

      return isShortRange(type) ? 'bar-chart' : 'histogram';
    case 'category':
      return scope === 'multiple' ? 'bar-chart' : 'ruler';
    case 'text':
      return 'fact';
    case 'numeric':
    case 'number':
      return riesgo === 'productivo' ? 'parcel-list' : 'fact';
  }
}

/**
 * How a range indicator (disease index 1–3, data quality 0–100 %) is read: three equal
 * classes over its scale. The metadata only gives min and max; the words and bands are
 * the product's.
 */
export const RANGE_CLASSES: readonly RiskClass[] = [
  { label: 'Sin riesgo', tone: 'low' },
  { label: 'Moderado', tone: 'medium' },
  { label: 'Severo', tone: 'high' },
];

/**
 * The backend's "not applicable" class, listed as a category on some indicators (ITR,
 * volatility) and answered where the indicator does not apply to the parcel's crop. It
 * is never a band of the ruler nor a column of the count widget: a parcel reading it has
 * no reading.
 */
export const NA_CATEGORY = 'NA';

/** The categories as the widgets lay them out: the indicator's own, in its order, NA left out. */
export function categoryAxis(categories: readonly string[]): string[] {
  return categories.filter((category) => category !== NA_CATEGORY);
}

/**
 * The band colours for a class count, from the design's colour scales:
 * four classes run blue, grey, orange, red; three drop the orange; two face off blue
 * against red; one is orange alone. More than four keep the ends and grey the middle.
 */
export function classTones(count: number): RiskTone[] {
  switch (count) {
    case 0:
      return [];
    case 1:
      return ['elevated'];
    case 2:
      return ['low', 'high'];
    case 3:
      return ['low', 'medium', 'high'];
    default:
      return Array.from({ length: count }, (_, index) =>
        index === 0
          ? 'low'
          : index === count - 1
            ? 'high'
            : index === count - 2
              ? 'elevated'
              : 'medium',
      );
  }
}

/**
 * A category indicator's classes are its own ordered categories (NA aside), read low to
 * high, coloured by how many there are (`classTones`).
 */
export function categoryClasses(categories: readonly string[]): RiskClass[] {
  const axis = categoryAxis(categories);
  const tones = classTones(axis.length);

  return axis.map((label, index) => ({ label, tone: tones[index] }));
}

/**
 * The class a 0–100 position falls in when the classes split the scale equally. A cut
 * point belongs to the class above it; out-of-range and unknown positions to the outer
 * classes (an unknown one to the first, like the ruler's left edge).
 */
export function classIndexAt(position: number, count: number): number {
  if (count <= 1 || Number.isNaN(position)) return 0;

  return Math.min(count - 1, Math.max(0, Math.floor((position / 100) * count)));
}
