import { linearTicks, tickStep, type NumberScale } from '@/lib/analysis/number-scale';
import { numberOf } from '@/lib/analysis/readings';
import type { ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators } from '@/lib/api/metadata/schemas';

/*
 * Projected production on Riesgo productivo: `LOW` / `MID` / `HIGH` × `H5` / `H10`,
 * per crop, drawn as one chart instead of six number widgets — the pessimist–optimist
 * band and the neutral line, from the historical base (`Pro_*`) to each horizon.
 *
 * Recognised by id (api-filters): the API lists these flat, with no group, scenario or
 * horizon attribute, so the id carries them, like the crop suffix
 * (`applicable-indicators.ts`). Read the grouping from the metadata once it carries one.
 */

const SCENARIO_ID = /^(LOW|MID|HIGH)_(H5|H10)_(soja|arroz)$/i;

const HORIZONS = [
  { key: 'H5', label: 'Horizonte 5 años' },
  { key: 'H10', label: 'Horizonte 10 años' },
] as const;

export const PROJECTION_TITLE = 'Producción proyectada a escenario pesimista, neutro y optimista';

/**
 * One point of the chart: the band from `low` to `high`, the neutral line through `mid`.
 */
export type ProjectionPoint = {
  label: string;
  low: number;
  mid: number;
  high: number;
};

export type ProjectionWidget = NumberScale & {
  id: string;
  label: string;
  description?: string;
  unit: string | null;
  scope: ParcelScope;
  points: ProjectionPoint[];
};

/** The crop a projection indicator belongs to (`soja`, `arroz`), or `null` for any other id. */
export function projectionCrop(id: string): string | null {
  const match = SCENARIO_ID.exec(id);

  return match === null ? null : match[3].toLowerCase();
}

/** The `p`-th percentile (0–1), linearly interpolated between the closest ranks, as numpy does. */
export function percentile(values: number[], p: number): number {
  const sorted = values.toSorted((a, b) => a - b);
  const rank = (sorted.length - 1) * p;
  const below = Math.floor(rank);
  const above = Math.ceil(rank);

  return sorted[below] + (sorted[above] - sorted[below]) * (rank - below);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The axis around the band, not from zero: production moves within a narrow t/ha span,
 * which a zero-based axis would flatten. Round figures just outside the extremes, five
 * ticks or so.
 */
export function projectionScale(values: number[]): NumberScale {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const step = tickStep(high - low || Math.abs(high) || 1, 4);
  const min = Number((Math.floor(low / step) * step).toPrecision(12));
  const max = Number((Math.ceil(high / step) * step).toPrecision(12));
  const top = max > min ? max : min + step;

  return { min, max: top, ticks: linearTicks(min, top, 4) };
}

/**
 * The point for one parcel: its own pessimist, central and optimist values. The base has
 * one value, so the band narrows to it there. `undefined` when any of the three is missing.
 */
function parcelPoint(
  parcel: AnalysisParcel,
  label: string,
  ids: { low: string; mid: string; high: string },
): ProjectionPoint | undefined {
  const low = numberOf(parcel, ids.low);
  const mid = numberOf(parcel, ids.mid);
  const high = numberOf(parcel, ids.high);

  if (low === undefined || mid === undefined || high === undefined) return undefined;

  return { label, low, mid, high };
}

/**
 * The point for the selection: the band from the 10th percentile of the parcels'
 * pessimist values to the 90th of their optimist ones, the line at the mean of their
 * central values. Parcels without a reading are left out; none at all, no point.
 */
function selectionPoint(
  parcels: AnalysisParcel[],
  label: string,
  ids: { low: string; mid: string; high: string },
): ProjectionPoint | undefined {
  const values = (id: string) => parcels.flatMap((parcel) => numberOf(parcel, id) ?? []);
  const lows = values(ids.low);
  const mids = values(ids.mid);
  const highs = values(ids.high);

  if (lows.length === 0 || mids.length === 0 || highs.length === 0) return undefined;

  return { label, low: percentile(lows, 0.1), mid: mean(mids), high: percentile(highs, 0.9) };
}

/**
 * One projection chart per crop whose scenarios the picker shows, keyed `projection_<crop>`:
 * the historical base, then each horizon with readings. A parcel tab reads the open
 * parcel; Todas, every submitted parcel. No horizon with readings, no chart.
 */
export function projectionWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  scope: ParcelScope,
  parcel: AnalysisParcel | null | undefined,
  year?: string,
): ProjectionWidget[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((entry) => [String(entry.parcel_id), entry]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);
  const crops = [...new Set(indicators.flatMap((indicator) => projectionCrop(indicator.id) ?? []))];

  return crops.flatMap((crop): ProjectionWidget[] => {
    const point = (label: string, ids: { low: string; mid: string; high: string }) => {
      if (scope === 'multiple') return selectionPoint(submitted, label, ids);

      return parcel ? parcelPoint(parcel, label, ids) : undefined;
    };
    const horizons = HORIZONS.flatMap(
      ({ key, label }) =>
        point(label, {
          low: `LOW_${key}_${crop}`,
          mid: `MID_${key}_${crop}`,
          high: `HIGH_${key}_${crop}`,
        }) ?? [],
    );

    if (horizons.length === 0) return [];

    const pro = `Pro_${crop}`;
    // The base is named by the year it stands for, the current one.
    const base = point(year ?? 'Base histórica', { low: pro, mid: pro, high: pro });
    const points = base ? [base, ...horizons] : horizons;
    const central = indicators.find((indicator) => indicator.id.toLowerCase() === `mid_h5_${crop}`);
    const unit =
      indicators.find((indicator) => projectionCrop(indicator.id) === crop)?.unit ?? null;

    return [
      {
        id: `projection_${crop}`,
        label: PROJECTION_TITLE,
        description: central?.description ?? undefined,
        unit,
        scope,
        points,
        ...projectionScale(points.flatMap(({ low, high }) => [low, high])),
      },
    ];
  });
}
