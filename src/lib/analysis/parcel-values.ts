import { isAreaIndicator } from '@/lib/analysis/area';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { numberOf } from '@/lib/analysis/readings';
import { widgetFor } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The per-parcel value widget: one indicator, one row per analysed parcel
 * with its figure and a track — filled on the indicator's own scale when it has one (a
 * range, IEP 0–100 %), else relative to the largest parcel (an open number, t/ha). Riesgo
 * productivo reads its numbers this way; sanitario's are facts. Pure, node-tested.
 */

export type ParcelValueRow = {
  parcelId: string;
  /** "Parcela N", as the hero's tab shows it (`parcelLabel`). */
  label: string;
  value: number;
  /** The figure as printed: platform locale, two decimals at most. */
  text: string;
  /** 0–100: the track filled — on the range's scale, or relative to the widget's largest value. */
  position: number;
};

export type ParcelValuesWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  unit: string | null;
  rows: ParcelValueRow[];
};

/**
 * One widget per indicator that renders as parcel values, in metadata order. `listed` are
 * the parcels that get a row — the whole submission under Todas, the open tab's parcel
 * alone otherwise — numbered "Parcela N" by their place in the submission (`parcelIds`),
 * so a parcel keeps its number whichever tab is open. A parcel with no reading has no row;
 * an indicator no listed parcel answered has no widget.
 */
export function parcelValueWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  listed: readonly string[] = parcelIds,
): ParcelValuesWidget[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    // A list of parcels is the multiple view by nature; the scope only narrows the rows.
    if (widgetFor(indicator.indicator_type, { riesgo, scope: 'multiple' }) !== 'parcel-list') {
      return [];
    }
    if (isAreaIndicator(indicator)) return [];

    const readings = listed.flatMap((parcelId) => {
      const parcel = byId.get(parcelId);
      const value = parcel === undefined ? undefined : numberOf(parcel, indicator.id);

      return value === undefined
        ? []
        : [{ parcelId, label: parcelLabel(parcelId, parcelIds), value }];
    });

    if (readings.length === 0) return [];

    const max = Math.max(...readings.map((reading) => reading.value));
    const type = indicator.indicator_type;
    const position = (value: number) => {
      if (type.type === 'range' && type.max > type.min) {
        return ((value - type.min) / (type.max - type.min)) * 100;
      }

      return max > 0 ? (value / max) * 100 : 0;
    };
    const rows = readings.map((reading) => ({
      ...reading,
      text: formatFigure(reading.value),
      position: Math.min(100, Math.max(0, position(reading.value))),
    }));

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        unit: indicator.unit ?? null,
        rows,
      },
    ];
  });
}

function formatFigure(value: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
}
