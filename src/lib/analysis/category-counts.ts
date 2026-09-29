import { isAreaIndicator } from '@/lib/analysis/area';
import { categoryIndex } from '@/lib/analysis/indicator-cards';
import { hasColumn, readingOf } from '@/lib/analysis/readings';
import { widgetKindOf } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The category-count tile (Figma Widget03 on productivo): one indicator, one column per
 * category the indicator defines, with how many analysed parcels fall in it. Pure,
 * node-tested.
 */

/**
 * The backend's "not applicable" class, listed as a category on some indicators (ITR,
 * volatility) and answered where the indicator does not apply to the parcel's crop. It
 * is never a column of the tile and a parcel reading it is counted nowhere.
 */
const NA_CATEGORY = 'NA';

/** The bar's hue: grey for the low classes, blue for the middle ones, orange for the high. */
export type CategoryTone = 'low' | 'mid' | 'high';

export type CategoryColumn = {
  label: string;
  count: number;
  /** 0–100: the bar's height relative to the fullest column. */
  height: number;
  tone: CategoryTone;
};

/**
 * The design paints a category by its magnitude word, whatever the indicator: "Bajo"
 * and "Muy bajo" grey, "Medio" and "Media" blue, "Alto" orange (Figma Widget03, the
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
  columns: CategoryColumn[];
};

/**
 * The categories as the tile lays them out: the indicator's own, in the order it defines
 * them ("Alta, Media, Baja"). "NA" is not a column: a parcel answering it has no reading,
 * so nothing could ever be counted there.
 */
export function categoryAxis(categories: readonly string[]): string[] {
  return categories.filter((category) => category !== NA_CATEGORY);
}

/**
 * One tile per category indicator the answer carries, in metadata order, over the
 * parcels Analizar submitted. A tile always shows every category, empty ones included —
 * an indicator that does not apply to the crop (every parcel NA) shows with nothing
 * counted. Only an indicator the answer has no column for gets no tile.
 */
export function categoryCountTiles(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
): CategoryCountTile[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    const type = indicator.indicator_type;

    if (type.type !== 'category' || isAreaIndicator(indicator)) return [];
    if (widgetKindOf(riesgo, type.type) !== 'category-count') return [];

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

    const axis = categoryAxis(type.categories);
    const max = Math.max(0, ...axis.map((category) => counts.get(category) ?? 0));
    const columns = axis.map((category) => {
      const count = counts.get(category) ?? 0;

      return {
        label: category,
        count,
        height: max > 0 ? (count / max) * 100 : 0,
        tone: categoryTone(category),
      };
    });

    return [{ id: indicator.id, label: indicator.name, columns }];
  });
}
