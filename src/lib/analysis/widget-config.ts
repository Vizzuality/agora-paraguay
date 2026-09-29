import type { IndicatorType, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * What each indicator type renders as, and how a classed one is read. The analysis
 * answers bare values; the words on the tiles and the bands of the ruler are product
 * decisions (Figma Widget03), so they live here rather than in the API layer.
 */

/** The ruler band a class paints: blue, grey, red (`--risk-low`, muted, `--risk-high`). */
export type RiskTone = 'low' | 'medium' | 'high';

/** One class an indicator is read in: the word the tile prints and the band it sits on. */
export type RiskClass = { label: string; tone: RiskTone };

/** Which tile an indicator renders in. */
export type WidgetKind = 'risk-class' | 'general-info' | 'parcel-values' | 'category-count';

/**
 * Sanitario reads one parcel at a time: classed values (a bounded range, an ordered
 * category) get the risk-class tile with the ruler, everything else is a fact for the
 * general-info card. Productivo reads the whole selection: an open number (t/ha) lists
 * every parcel (Figma Widget01), a category counts the parcels in each class (Widget03).
 */
export function widgetKindOf(riesgo: Riesgo, type: IndicatorType['type']): WidgetKind {
  switch (type) {
    case 'range':
      return 'risk-class';
    case 'category':
      return riesgo === 'productivo' ? 'category-count' : 'risk-class';
    case 'text':
      return 'general-info';
    case 'numeric':
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
 * A category indicator's classes are its own ordered categories, read low to high like
 * the range ruler: the first band blue, the last red, anything between grey.
 */
export function categoryClasses(categories: readonly string[]): RiskClass[] {
  const last = categories.length - 1;

  return categories.map((label, index) => ({
    label,
    tone: index === 0 ? 'low' : index === last ? 'high' : 'medium',
  }));
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
