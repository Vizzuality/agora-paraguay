import { isAreaIndicator } from '@/lib/analysis/area';
import { categoryIndex } from '@/lib/analysis/indicator-cards';
import { hasColumn, readingOf } from '@/lib/analysis/readings';
import {
  categoryAxis,
  NA_CATEGORY,
  widgetKindOf,
  type ParcelScope,
} from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The category-count tile (the "Categorical multiple" design): one indicator, one
 * column per category the indicator defines, with how many analysed parcels fall in it.
 * Pure, node-tested; the bars are scaled by the chart (`CategoryBars`).
 */

export { categoryAxis };

/** The bar's hue: grey for the low classes, blue for the middle ones, orange for the high. */
export type CategoryTone = 'low' | 'mid' | 'high';

export type CategoryColumn = {
  label: string;
  count: number;
  tone: CategoryTone;
};

/**
 * The design paints a category by its magnitude word, whatever the indicator: "Bajo"
 * and "Muy bajo" grey, "Medio" and "Media" blue, "Alto" orange (the design's
 * volatility state). Read off the label: low words, high words, everything else middle
 * — so "Estable", "Moderado" and "Positiva" are blue.
 */
export function categoryTone(label: string): CategoryTone {
  const word = label.trim().toLowerCase();

  if (/^(muy )?baj[oa]$/.test(word)) return 'low';
  if (/^(muy )?alt[oa]$/.test(word) || word === 'alerta') return 'high';

  return 'mid';
}

export type CategoryCountTile = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  columns: CategoryColumn[];
};

/**
 * One tile per category indicator the answer carries, in metadata order, over the
 * parcels Analizar submitted — only under the `multiple` scope; one parcel reads its
 * class on the ruler instead (`indicatorCards`). A tile always shows every category,
 * empty ones included — an indicator that does not apply to the crop (every parcel NA)
 * shows with nothing counted. Only an indicator the answer has no column for gets no tile.
 */
export function categoryCountTiles(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  scope: ParcelScope,
): CategoryCountTile[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    const type = indicator.indicator_type;

    if (type.type !== 'category' || isAreaIndicator(indicator)) return [];
    if (widgetKindOf(riesgo, type.type, scope) !== 'category-count') return [];

    const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

    if (!submitted.some((parcel) => hasColumn(parcel, indicator.id))) return [];

    const counts = new Map<string, number>();

    for (const parcel of submitted) {
      const value = readingOf(parcel, indicator.id);
      const index = value === undefined ? undefined : categoryIndex(value, type.categories);

      if (index === undefined) continue;

      const category = type.categories[index];

      if (category === NA_CATEGORY) continue;

      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    const columns = categoryAxis(type.categories).map((category) => ({
      label: category,
      count: counts.get(category) ?? 0,
      tone: categoryTone(category),
    }));

    return [
      { id: indicator.id, label: indicator.name, description: indicator.description, columns },
    ];
  });
}
