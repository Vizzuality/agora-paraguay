import { NOT_AVAILABLE, type AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators } from '@/lib/api/metadata/schemas';

/*
 * The parcel area the mini map's thumbnail prints. The backend answers it as one more
 * indicator column (`area`, unit from the list); it is a fact of the selection, so it is
 * always requested and never a card or a picker entry. Pure, node-tested.
 */

export const AREA_INDICATOR_ID = 'area';

/** The area indicator, matched by id ignoring case like every other column. */
export function isAreaIndicator(indicator: Indicator): boolean {
  return indicator.id.toLowerCase() === AREA_INDICATOR_ID;
}

export type ParcelArea = { value: number; unit: string | null };

/**
 * The area of the open tab: the active parcel's reading, or the parcels summed under
 * Todas (`activeId === null`). `null` while the metadata has no area indicator, the
 * analysis has not answered, or no parcel carries a number for it.
 */
export function parcelArea(
  parcels: AnalysisParcel[],
  activeId: string | null,
  indicators: Indicators | undefined,
): ParcelArea | null {
  const indicator = indicators?.find(isAreaIndicator);

  if (!indicator) return null;

  const shown =
    activeId === null ? parcels : parcels.filter((p) => String(p.parcel_id) === activeId);
  const readings = shown.flatMap((parcel) => {
    const value = areaOf(parcel, indicator.id);

    return value === undefined ? [] : [value];
  });

  if (readings.length === 0) return null;

  return {
    value: readings.reduce((sum, value) => sum + value, 0),
    unit: indicator.unit ?? null,
  };
}

/** The parcel's number under the area column, whatever its casing; `undefined` when absent or not a number. */
function areaOf(parcel: AnalysisParcel, id: string): number | undefined {
  const wanted = id.toLowerCase();
  const column = Object.keys(parcel.properties).find((key) => key.toLowerCase() === wanted);
  const value = column === undefined ? undefined : parcel.properties[column];

  if (value === null || value === undefined || value === '' || value === NOT_AVAILABLE) {
    return undefined;
  }

  const number = typeof value === 'number' ? value : Number(value);

  return Number.isNaN(number) ? undefined : number;
}

/** "17,5 ha": the figure in the platform's locale, one decimal at most, the unit when there is one. */
export function formatArea({ value, unit }: ParcelArea): string {
  const number = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 1 }).format(value);

  return unit ? `${number} ${unit}` : number;
}
