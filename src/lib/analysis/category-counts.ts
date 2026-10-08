import { isAreaIndicator } from '@/lib/analysis/area';
import { categoryIndex, rangeClassIndex } from '@/lib/analysis/indicator-cards';
import { hasColumn, numberOf, readingOf } from '@/lib/analysis/readings';
import {
  categoryAxis,
  categoryClasses,
  NA_CATEGORY,
  RANGE_CLASSES,
  widgetFor,
  type ParcelScope,
  type RiskClass,
  type RiskTone,
} from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The class-count widget (the "Categorical multiple" design): one indicator, one column
 * per class the indicator is read in, with how many analysed parcels fall in it. A
 * category's classes are its own categories; a short range's are the ruler's three
 * (`RANGE_CLASSES`). Pure, node-tested; the bars are scaled by the chart (`CategoryBars`).
 */

export { categoryAxis };

export type CategoryColumn = {
  label: string;
  count: number;
  /** The bar's hue: the band the ruler paints the same class with (`classTones`). */
  tone: RiskTone;
};

export type CategoryCountWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  columns: CategoryColumn[];
};

/**
 * The classes an indicator is counted in, and which one a parcel's reading falls in —
 * `undefined` when the parcel has no reading the classes can place (NA included).
 */
type Counting = {
  classes: RiskClass[];
  classOf: (parcel: AnalysisParcel) => number | undefined;
};

function countingFor(indicator: Indicator): Counting | undefined {
  const type = indicator.indicator_type;

  switch (type.type) {
    case 'category': {
      const axis = categoryAxis(type.categories);

      return {
        classes: categoryClasses(type.categories),
        classOf: (parcel) => {
          const value = readingOf(parcel, indicator.id);
          const index = value === undefined ? undefined : categoryIndex(value, type.categories);

          if (index === undefined) return undefined;

          const category = type.categories[index];

          return category === NA_CATEGORY ? undefined : axis.indexOf(category);
        },
      };
    }
    case 'range':
      return {
        classes: [...RANGE_CLASSES],
        classOf: (parcel) => {
          const value = numberOf(parcel, indicator.id);

          return value === undefined ? undefined : rangeClassIndex(value, type);
        },
      };
    default:
      return undefined;
  }
}

/**
 * One widget per indicator that counts under this riesgo and scope (`widgetFor`), in
 * metadata order, over the parcels Analizar submitted — only under the `multiple` scope;
 * one parcel reads its class on the ruler instead (`indicatorCards`). A widget always
 * shows every class, empty ones included — an indicator that does not apply to the crop
 * (every parcel NA) shows with nothing counted. Only an indicator the answer has no column
 * for gets no widget.
 */
export function categoryCountWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  scope: ParcelScope,
): CategoryCountWidget[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    if (isAreaIndicator(indicator)) return [];
    if (widgetFor(indicator.indicator_type, { riesgo, scope }) !== 'bar-chart') return [];

    const counting = countingFor(indicator);

    if (!counting) return [];

    const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

    if (!submitted.some((parcel) => hasColumn(parcel, indicator.id))) return [];

    const counts = counting.classes.map(() => 0);

    for (const parcel of submitted) {
      const index = counting.classOf(parcel);

      if (index !== undefined && index >= 0 && index < counts.length) counts[index] += 1;
    }

    const columns = counting.classes.map((riskClass, index) => ({
      label: riskClass.label,
      count: counts[index],
      tone: riskClass.tone,
    }));

    return [
      { id: indicator.id, label: indicator.name, description: indicator.description, columns },
    ];
  });
}
