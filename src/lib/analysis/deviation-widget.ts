import { isAreaIndicator } from '@/lib/analysis/area';
import { numberScale } from '@/lib/analysis/number-scale';
import { numberOf } from '@/lib/analysis/readings';
import { widgetFor, type ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { IndicatorType, Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The deviation widget (the diverging Widget03 design): one parcel's signed difference
 * from a reference as the large figure, `+0,5`, and a marker on a track with the
 * reference in the middle — red to the left of it, blue to the right — the reference's
 * own value printed under it when the metadata names the indicator it comes from
 * (`base`, the crop's historical production). Scale symmetric around the reference, the
 * same the Todas histogram draws, so a parcel reads against the set. Pure, node-tested.
 */

export type DeviationWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  unit: string | null;
  value: number;
  /** The figure as printed, sign first: "+0,5", "-0,3", "0". */
  text: string;
  /** The farthest deviation the track shows, either side of zero. */
  span: number;
  /** 0–100 across the whole track: 50 is zero, 100 is `+span`. */
  position: number;
  /** The parcel's reading of the base indicator, when the metadata names one and the parcel has it. */
  base: number | null;
};

/**
 * How far the scale reaches either side of zero: the metadata's bound when it gives one
 * (`max`, or `min` for a backend writing the negative side), else a round figure just
 * above the largest absolute value analysed (`numberScale`), so the axis ends cleanly.
 */
export function deviationSpan(type: IndicatorType, values: number[]): number {
  if (type.type === 'deviation') {
    const bound = Math.max(Math.abs(type.min ?? 0), Math.abs(type.max ?? 0));

    if (bound > 0) return bound;
  }

  return numberScale(values.map(Math.abs)).max;
}

/** Where a deviation sits on the diverging track, 0–100, zero in the middle, clamped. */
export function deviationPosition(value: number, span: number): number {
  if (span <= 0) return 50;

  return Math.min(100, Math.max(0, 50 + (value / span) * 50));
}

/** The figure with its sign, platform locale, two decimals at most; zero carries none. */
export function formatSigned(value: number): string {
  return new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value);
}

/**
 * One widget per indicator that renders as a deviation under this riesgo and scope
 * (`widgetFor`), in metadata order, for the open parcel's reading. The span covers every
 * submitted parcel's deviation, not only the open one's. A parcel with no reading gets no
 * widget.
 */
export function deviationWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: Riesgo,
  scope: ParcelScope,
  parcel: AnalysisParcel | null | undefined,
): DeviationWidget[] {
  if (!indicators || !parcel) return [];

  const byId = new Map(parcels.map((entry) => [String(entry.parcel_id), entry]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

  return indicators.flatMap((indicator) => {
    if (isAreaIndicator(indicator)) return [];
    if (widgetFor(indicator.indicator_type, { riesgo, scope }) !== 'deviation') return [];

    const value = numberOf(parcel, indicator.id);

    if (value === undefined) return [];

    const type = indicator.indicator_type;
    const span = deviationSpan(
      type,
      submitted.flatMap((entry) => numberOf(entry, indicator.id) ?? []),
    );
    const baseId = type.type === 'deviation' ? type.base : undefined;

    return [
      {
        id: indicator.id,
        label: indicator.name,
        description: indicator.description,
        unit: indicator.unit ?? null,
        value,
        text: formatSigned(value),
        span,
        position: deviationPosition(value, span),
        base: baseId === undefined ? null : (numberOf(parcel, baseId) ?? null),
      },
    ];
  });
}
