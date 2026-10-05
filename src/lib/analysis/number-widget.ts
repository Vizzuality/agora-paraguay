import { isAreaIndicator } from '@/lib/analysis/area';
import { formatNumber, numberScale } from '@/lib/analysis/number-scale';
import { numberOf } from '@/lib/analysis/readings';
import { widgetFor, type ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The number widget (the "Numerical individual" design): one parcel's open number
 * as the large figure, with a marker at its place on a scale from zero to a round figure
 * above the largest analysed value — the same scale the Todas histogram draws, so the
 * parcel can be read against the set. Pure, node-tested.
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

/**
 * One widget per indicator that renders as a number widget under this riesgo and scope
 * (`widgetFor`), in metadata order, for the open parcel's reading. The scale spans every
 * submitted parcel's value, not only the open one's. A parcel with no reading gets no widget.
 */
export function numberWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  scope: ParcelScope,
  parcel: AnalysisParcel | null | undefined,
): NumberWidget[] {
  if (!indicators || !parcel) return [];

  const byId = new Map(parcels.map((entry) => [String(entry.parcel_id), entry]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

  return indicators.flatMap((indicator) => {
    if (isAreaIndicator(indicator)) return [];
    if (widgetFor(indicator.indicator_type, { riesgo, scope }) !== 'number') return [];

    const value = numberOf(parcel, indicator.id);

    if (value === undefined) return [];

    const scale = numberScale(submitted.flatMap((entry) => numberOf(entry, indicator.id) ?? []));

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        unit: indicator.unit ?? null,
        value,
        text: formatNumber(value),
        ...scale,
        position: Math.min(100, Math.max(0, (value / scale.max) * 100)),
      },
    ];
  });
}
