import { isAreaIndicator } from '@/lib/analysis/area';
import { hasColumn, numberOf } from '@/lib/analysis/readings';
import {
  classIndexAt,
  RANGE_CLASSES,
  widgetFor,
  type ParcelScope,
  type RiskClass,
  type RiskTone,
} from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The value-histogram widget (the "Categorical and numerical multiple" design): one long
 * range indicator (0–100 %), its scale cut in equal bins, each bin as tall as the number of
 * analysed parcels whose value falls in it, painted by the class the bin sits in. The class
 * names run under the scale in equal thirds, as on the ruler. Pure, node-tested; the chart
 * (`ValueHistogram`) places the bins.
 */

/** The design draws the scale in twenty bins, whatever the range. */
export const HISTOGRAM_BINS = 20;

export type HistogramBin = {
  /** The bin's edges on the indicator's scale; a value on the upper edge belongs to the bin above, the maximum to the last. */
  from: number;
  to: number;
  count: number;
  /** The class the bin's middle falls in, which is the bar's hue. */
  tone: RiskTone;
};

export type ValueHistogramWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  min: number;
  max: number;
  classes: readonly RiskClass[];
  bins: HistogramBin[];
};

type Range = { min: number; max: number };

/**
 * The values binned over the range: `count` equal bins, every one kept so the scale reads
 * whole. A value outside the range lands in the outer bin, as the ruler clamps it.
 */
export function histogramBins(
  values: number[],
  range: Range,
  count = HISTOGRAM_BINS,
  classes: readonly RiskClass[] = RANGE_CLASSES,
): HistogramBin[] {
  const span = range.max - range.min;
  const width = span / count;
  const counts = Array.from({ length: count }, () => 0);

  for (const value of values) {
    const index = span > 0 ? Math.floor(((value - range.min) / span) * count) : 0;

    counts[Math.min(count - 1, Math.max(0, index))] += 1;
  }

  return counts.map((binCount, index) => {
    const middle = ((index + 0.5) / count) * 100;

    return {
      from: range.min + index * width,
      to: index === count - 1 ? range.max : range.min + (index + 1) * width,
      count: binCount,
      tone: classes[classIndexAt(middle, classes.length)].tone,
    };
  });
}

/**
 * One widget per indicator that bins under this riesgo and scope (`widgetFor`), in
 * metadata order, over the parcels Analizar submitted. Every bin is kept, empty ones
 * included; only an indicator the answer has no column for gets no widget.
 */
export function valueHistogramWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  scope: ParcelScope,
): ValueHistogramWidget[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    const type = indicator.indicator_type;

    if (type.type !== 'range' || isAreaIndicator(indicator)) return [];
    if (widgetFor(type, { riesgo, scope }) !== 'histogram') return [];

    const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

    if (!submitted.some((parcel) => hasColumn(parcel, indicator.id))) return [];

    const values = submitted.flatMap((parcel) => numberOf(parcel, indicator.id) ?? []);

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        min: type.min,
        max: type.max,
        classes: RANGE_CLASSES,
        bins: histogramBins(values, type),
      },
    ];
  });
}

/** A bin's edges as printed: "15 – 20", platform locale, two decimals at most. */
export function binLabel(bin: Pick<HistogramBin, 'from' | 'to'>): string {
  return `${formatEdge(bin.from)} – ${formatEdge(bin.to)}`;
}

function formatEdge(value: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
}
