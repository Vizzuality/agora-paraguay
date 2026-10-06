import { isAreaIndicator } from '@/lib/analysis/area';
import { formatNumber, linearTicks, numberScale } from '@/lib/analysis/number-scale';
import { hasColumn, numberOf } from '@/lib/analysis/readings';
import {
  classIndexAt,
  isShortRange,
  RANGE_CLASSES,
  widgetFor,
  type ParcelScope,
  type RiskClass,
  type RiskTone,
} from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The value-histogram widget: one indicator's scale cut in equal bins, each bin as tall as
 * the number of analysed parcels whose value falls in it. A long range (0–100 %) paints a
 * bin by the class it sits in and names the classes under the scale in equal thirds, as on
 * the ruler (the "Categorical and numerical multiple" design); an open number (t/ha) has
 * no classes, runs from zero to a round figure above the largest value and paints every
 * bin orange (the "Numerical multiple" design). A productivo range is drawn like the open
 * number over its own `min`–`max`: a short one (a 0–8 count of seasons) with one bin per
 * step, centred on the value and labelled by it; a long one (0–100 %) in the usual twenty.
 * Pure, node-tested; the chart (`ValueHistogram`) places the bins.
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
  /** How the bin is named when not by its edges: the one value a stepped bin holds. */
  label?: string;
};

export type ValueHistogramWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  unit: string | null;
  min: number;
  max: number;
  /** The scale's tick values, printed under the baseline. */
  ticks: number[];
  /** The classes named under the scale; none for an open number. */
  classes?: readonly RiskClass[];
  bins: HistogramBin[];
};

type Range = { min: number; max: number };

/** How the bins are painted: by the class each sits in, or all in one tone. */
type Paint = { classes: readonly RiskClass[] } | { tone: RiskTone };

/** The default paint: a range's bins in the ruler's classes. */
const RANGE_PAINT: Paint = { classes: RANGE_CLASSES };

/**
 * The values binned over the range: `count` equal bins, every one kept so the scale reads
 * whole. A value outside the range lands in the outer bin, as the ruler clamps it.
 */
export function histogramBins(
  values: number[],
  range: Range,
  paint: Paint = RANGE_PAINT,
  count = HISTOGRAM_BINS,
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
      tone:
        'tone' in paint
          ? paint.tone
          : paint.classes[classIndexAt(middle, paint.classes.length)].tone,
    };
  });
}

type SteppedRange = { min: number; max: number; step?: number | string };

/**
 * A short range's values, one bin per step, each centred on its value and labelled by
 * it: 0–8 in steps of 1 is nine bins, the first from -0,5 to 0,5 named "0". The scale
 * the bins sit on is the range padded by half a step either side, so the chart's ticks
 * fall in the middle of the bins.
 */
export function steppedBins(
  values: number[],
  range: SteppedRange,
  tone: RiskTone = 'elevated',
): { min: number; max: number; bins: HistogramBin[] } {
  const step = Number(range.step ?? 1) || 1;
  const count = Math.max(1, Math.round((range.max - range.min) / step) + 1);
  const padded = { min: range.min - step / 2, max: range.max + step / 2 };
  const bins = histogramBins(values, padded, { tone }, count).map((bin, index) => ({
    ...bin,
    label: formatNumber(range.min + index * step),
  }));

  return { ...padded, bins };
}

/**
 * One widget per indicator that bins under this riesgo and scope (`widgetFor`), in
 * metadata order, over the parcels Analizar submitted. A sanitario range is binned over
 * its own scale in its classes; a productivo one over its own scale in one tone, per step
 * when short; an open number over `numberScale` of the values, in one tone. Every bin is
 * kept, empty ones included; only an indicator the answer has no column for gets no widget.
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

    if (isAreaIndicator(indicator)) return [];
    if (widgetFor(type, { riesgo, scope }) !== 'histogram') return [];

    const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

    if (!submitted.some((parcel) => hasColumn(parcel, indicator.id))) return [];

    const values = submitted.flatMap((parcel) => numberOf(parcel, indicator.id) ?? []);
    const widget = {
      id: indicator.id,
      label: indicator.name,
      description: indicator.description,
      unit: indicator.unit ?? null,
    };

    if (type.type === 'range' && riesgo === 'productivo') {
      const ticks = linearTicks(type.min, type.max);

      if (isShortRange(type)) return [{ ...widget, ticks, ...steppedBins(values, type) }];

      return [
        {
          ...widget,
          min: type.min,
          max: type.max,
          ticks,
          bins: histogramBins(values, type, { tone: 'elevated' }),
        },
      ];
    }

    if (type.type === 'range') {
      return [
        {
          ...widget,
          min: type.min,
          max: type.max,
          ticks: linearTicks(type.min, type.max),
          classes: RANGE_CLASSES,
          bins: histogramBins(values, type),
        },
      ];
    }

    const scale = numberScale(values);

    return [{ ...widget, ...scale, bins: histogramBins(values, scale, { tone: 'elevated' }) }];
  });
}

/** A bin as printed: its own label when it has one, else its edges, "15 – 20", platform locale. */
export function binLabel(bin: Pick<HistogramBin, 'from' | 'to' | 'label'>): string {
  return bin.label ?? `${formatNumber(bin.from)} – ${formatNumber(bin.to)}`;
}
