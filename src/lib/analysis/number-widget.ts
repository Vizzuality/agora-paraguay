import { isAreaIndicator } from '@/lib/analysis/area';
import {
  formatNumber,
  linearTicks,
  openNumberScale,
  type NumberScale,
} from '@/lib/analysis/number-scale';
import { numberOf } from '@/lib/analysis/readings';
import { widgetFor, type ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { IndicatorType, Indicators, IndicatorsRiesgo } from '@/lib/api/metadata/schemas';

/*
 * The number widget (the "Numerical individual" design): one parcel's number as the
 * large figure, with a marker at its place on a scale — for an open number, from zero to
 * a round figure above the largest analysed value, the same scale the Todas histogram
 * draws, so the parcel can be read against the set; for a range, the range itself
 * (`min`–`max`), whatever the set. Pure, node-tested.
 */

export type NumberWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  unit: string | null;
  value: number;
  /** The figure as printed. */
  text: string;
  min: number;
  max: number;
  ticks: number[];
  /** 0–100: where the marker sits on the scale. */
  position: number;
};

/** The scale a number is drawn on: the range's own, else by its unit (`openNumberScale`). */
export function scaleFor(type: IndicatorType, values: number[], unit?: string | null): NumberScale {
  if (type.type === 'range') {
    return { min: type.min, max: type.max, ticks: linearTicks(type.min, type.max) };
  }

  return openNumberScale(values, unit);
}

/**
 * One widget per indicator that renders as a number widget under this riesgo and scope
 * (`widgetFor`), in metadata order, for the open parcel's reading. An open number's scale
 * spans every submitted parcel's value, not only the open one's; a range's is its own.
 * A parcel with no reading gets no widget.
 */
export function numberWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: IndicatorsRiesgo,
  scope: ParcelScope,
  parcel: AnalysisParcel | null | undefined,
): NumberWidget[] {
  if (!indicators || !parcel) return [];

  const byId = new Map(parcels.map((entry) => [String(entry.parcel_id), entry]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

  return indicators.flatMap((indicator) => {
    if (isAreaIndicator(indicator)) return [];
    if (widgetFor(indicator.indicator_type, { riesgo, scope, unit: indicator.unit }) !== 'number')
      return [];

    const value = numberOf(parcel, indicator.id);

    if (value === undefined) return [];

    const scale = scaleFor(
      indicator.indicator_type,
      submitted.flatMap((entry) => numberOf(entry, indicator.id) ?? []),
      indicator.unit,
    );
    const span = scale.max - scale.min;
    const position = span > 0 ? ((value - scale.min) / span) * 100 : 0;

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        unit: indicator.unit ?? null,
        value,
        text: formatNumber(value),
        ...scale,
        position: Math.min(100, Math.max(0, position)),
      },
    ];
  });
}
