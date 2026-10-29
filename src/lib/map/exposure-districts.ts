import type { ExpressionSpecification } from 'maplibre-gl';

import type { AnalysisParcel, ParcelValue } from '@/lib/api/analysis/schemas';

/** A district on the exposure layer, read from its feature's properties. */
export type ExposureDistrict = {
  id: string;
  name: string;
  department: string | null;
  /** `Ex_class` as the layer spells it ("Bajo", "Medio", "Alto"), when present. */
  exposure: string | null;
  /** Every property of the feature: the exposure indicators read their values here. */
  properties: Record<string, unknown>;
};

/**
 * The district key: department + district code (`"0721"`), shared by every global layer
 * so a pick on one filters the others. The layers disagree on case (`CLAVE` on the
 * exposure layer, `clave` on soy), so both spellings are read.
 */
export const DISTRICT_KEY_EXPRESSION: ExpressionSpecification = [
  'to-string',
  ['coalesce', ['get', 'CLAVE'], ['get', 'clave'], ''],
];

/** The exposure classes in legend order, with the fill each paints (chart-1/3/4). */
const EXPOSURE_CLASS_COLORS = {
  Bajo: '#4C95FF',
  Medio: '#FF871F',
  Alto: '#FF3838',
} as const;

/** How the tooltip words a class: the legend's labels, the layer's other classes as given. */
export function exposureLabel(exposure: string): string {
  const labels: Record<string, string> = {
    Bajo: 'Baja exposición',
    Medio: 'Media exposición',
    Alto: 'Alta exposición',
  };

  return labels[exposure] ?? exposure;
}

/**
 * The exposure layer's fill: its class colour, grey for the classes the legend lacks
 * ("Sin soja", "Sin exposición identificada").
 */
export const EXPOSURE_FILL: ExpressionSpecification = [
  'match',
  ['get', 'Ex_class'],
  'Bajo',
  EXPOSURE_CLASS_COLORS.Bajo,
  'Medio',
  EXPOSURE_CLASS_COLORS.Medio,
  'Alto',
  EXPOSURE_CLASS_COLORS.Alto,
  '#96A3B5',
];

/** A district as the analysis widgets read a parcel: its key and its scalar properties. */
export function asDistrictParcel(district: ExposureDistrict): AnalysisParcel {
  const properties: Record<string, ParcelValue> = {};

  for (const [key, value] of Object.entries(district.properties)) {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
      properties[key] = value;
    }
  }

  return { parcel_id: district.id, properties };
}

/** The district a clicked or hovered feature belongs to, or `null` when it carries none. */
export function districtFromProperties(
  properties: Record<string, unknown> | null | undefined,
): ExposureDistrict | null {
  const get = caseInsensitive(properties ?? {});
  const id = get('clave');

  if (id === undefined || id === null || id === '') return null;

  return {
    id: String(id),
    name: text(get('dist_desc_')) ?? `Distrito ${String(id)}`,
    department: text(get('dpto_desc')),
    exposure: typeof get('ex_class') === 'string' ? (get('ex_class') as string) : null,
    properties: properties ?? {},
  };
}

function caseInsensitive(properties: Record<string, unknown>) {
  const lowered = new Map(
    Object.entries(properties).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return (key: string) => lowered.get(key);
}

/** A place name in title case — the layers spell them in capitals ("SAN RAFAEL DEL PARANÁ"). */
function text(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;

  return value
    .toLocaleLowerCase('es')
    .replace(
      /(^|\s)(\p{L})/gu,
      (_, space: string, letter: string) => space + letter.toLocaleUpperCase('es'),
    );
}
