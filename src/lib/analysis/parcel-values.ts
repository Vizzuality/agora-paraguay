import { isAreaIndicator } from '@/lib/analysis/area';
import { numberOf } from '@/lib/analysis/readings';
import { widgetKindOf } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The per-parcel value tile (Figma Widget01): one indicator, one row per analysed parcel
 * with its figure and a track — filled on the indicator's own scale when it has one (a
 * range, IEP 0–100 %), else relative to the largest parcel (an open number, t/ha). Riesgo
 * productivo reads its numbers this way; sanitario's are facts. Pure, node-tested.
 */

export type ParcelValueRow = {
  parcelId: string;
  /** The parcel's id, as the hero's tab shows it. */
  label: string;
  value: number;
  /** The figure as printed: platform locale, two decimals at most. */
  text: string;
  /** 0–100: the track filled — on the range's scale, or relative to the tile's largest value. */
  position: number;
};

export type ParcelValuesTile = {
  id: string;
  label: string;
  unit: string | null;
  rows: ParcelValueRow[];
};

/**
 * One tile per indicator that renders as parcel values, in metadata order, restricted to
 * the parcels Analizar submitted, in their order. A parcel with no reading has no row; an
 * indicator no parcel answered has no tile.
 */
export function parcelValueTiles(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
): ParcelValuesTile[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));

  return indicators.flatMap((indicator) => {
    if (widgetKindOf(riesgo, indicator.indicator_type.type) !== 'parcel-values') return [];
    if (isAreaIndicator(indicator)) return [];

    const readings = parcelIds.flatMap((parcelId) => {
      const parcel = byId.get(parcelId);
      const value = parcel === undefined ? undefined : numberOf(parcel, indicator.id);

      return value === undefined ? [] : [{ parcelId, label: parcelId, value }];
    });

    if (readings.length === 0) return [];

    const max = Math.max(...readings.map((reading) => reading.value));
    const type = indicator.indicator_type;
    const position = (value: number) =>
      type.type === 'range' && type.max > type.min
        ? ((value - type.min) / (type.max - type.min)) * 100
        : max > 0
          ? (value / max) * 100
          : 0;
    const rows = readings.map((reading) => ({
      ...reading,
      text: formatFigure(reading.value),
      position: Math.min(100, Math.max(0, position(reading.value))),
    }));

    return [{ id: indicator.id, label: indicator.name, unit: indicator.unit ?? null, rows }];
  });
}

function formatFigure(value: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
}
