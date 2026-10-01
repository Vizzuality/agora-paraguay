import type { IndicatorType, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * What each indicator type renders as, and how a classed one is read. The analysis
 * answers bare values; the words on the tiles and the bands of the ruler are product
 * decisions, so they live here rather than in the API layer.
 */

/**
 * The ruler band a class paints: blue, grey, orange, red (`--risk-low`, muted,
 * `--risk-medium`, `--risk-high`).
 */
export type RiskTone = 'low' | 'medium' | 'elevated' | 'high';

/** One class an indicator is read in: the word the tile prints and the band it sits on. */
export type RiskClass = { label: string; tone: RiskTone };

/** Which tile an indicator renders in. */
export type WidgetKind = 'risk-class' | 'general-info' | 'parcel-values' | 'category-count';

/** How many parcels a tile reads: one (a parcel tab) or the whole selection (Todas). */
export type ParcelScope = 'individual' | 'multiple';

/**
 * A category is read per scope, whatever the riesgo (the "Categorical individual" and
 * "Categorical multiple" designs): one parcel gets its class on the ruler, several get the
 * parcels counted per class. The other types still follow the riesgo: sanitario reads a
 * bounded range on the ruler and everything else as a general-info fact; productivo
 * lists every parcel's number (Widget01) — text is a fact on both.
 */
export function widgetKindOf(
  riesgo: Riesgo,
  type: IndicatorType['type'],
  scope: ParcelScope,
): WidgetKind {
  switch (type) {
    case 'range':
      return riesgo === 'productivo' ? 'parcel-values' : 'risk-class';
    case 'category':
      return scope === 'multiple' ? 'category-count' : 'risk-class';
    case 'text':
      return 'general-info';
    case 'numeric':
    case 'number':
      return riesgo === 'productivo' ? 'parcel-values' : 'general-info';
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
 * is never a band of the ruler nor a column of the count tile: a parcel reading it has
 * no reading.
 */
export const NA_CATEGORY = 'NA';

/** The categories as the tiles lay them out: the indicator's own, in its order, NA left out. */
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
