import type { ExpressionSpecification } from 'maplibre-gl';

import { categoryClasses, type RiskClass, type RiskTone } from '@/lib/analysis/widget-config';
import type { AnalysisParcel, ParcelValue } from '@/lib/api/analysis/schemas';
import type { IndicatorType } from '@/lib/api/metadata/schemas';

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

/** How the tooltip words a class: the legend's labels, the layer's other classes as given. */
export function exposureLabel(exposure: string): string {
  const labels: Record<string, string> = {
    Bajo: 'Baja exposición',
    Medio: 'Media exposición',
    Alto: 'Alta exposición',
  };

  return labels[exposure] ?? exposure;
}

/** The indicator whose classes colour the exposure layer, as the panel's ruler reads it. */
const EXPOSURE_CLASS_INDICATOR = 'ex_class';

/** Until the metadata answers: the three classes the legend has always shown. */
const FALLBACK_CLASSES: readonly RiskClass[] = [
  { label: 'Bajo', tone: 'low' },
  { label: 'Medio', tone: 'elevated' },
  { label: 'Alto', tone: 'high' },
];

/**
 * The hex each ruler tone paints on the map, the dark chart values the map has always
 * used: MapLibre cannot read the CSS tokens the widgets paint with.
 */
const TONE_HEX: Record<RiskTone, string> = {
  none: '#1AF807',
  low: '#4C95FF',
  medium: '#96A3B5',
  elevated: '#FF871F',
  high: '#FF3838',
};

/** A class the metadata does not list paints the ruler's grey. */
const UNLISTED_FILL = TONE_HEX.medium;

/**
 * The exposure classes as the panel's ruler colours them: `Ex_class`'s categories from
 * the indicator metadata, through `categoryClasses` ("Sin soja" green first when listed).
 */
export function exposureClasses(
  indicators: readonly { id: string; indicator_type: IndicatorType }[] | undefined,
): readonly RiskClass[] {
  const type = indicators?.find(
    (indicator) => indicator.id.toLowerCase() === EXPOSURE_CLASS_INDICATOR,
  )?.indicator_type;

  return type?.type === 'category' && type.categories.length > 0
    ? categoryClasses(type.categories)
    : FALLBACK_CLASSES;
}

/** The exposure layer's fill: each feature's `Ex_class` in its class colour, grey unlisted. */
export function exposureFill(classes: readonly RiskClass[]): ExpressionSpecification | string {
  if (classes.length === 0) return UNLISTED_FILL;

  return [
    'match',
    ['get', 'Ex_class'],
    ...classes.flatMap(({ label, tone }) => [label, TONE_HEX[tone]]),
    UNLISTED_FILL,
  ] as unknown as ExpressionSpecification;
}

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
  const id = districtKey(get('clave'));

  if (id === null) return null;

  return {
    id,
    name: text(get('dist_desc_')) ?? `Distrito ${id}`,
    department: text(get('dpto_desc')),
    exposure: typeof get('ex_class') === 'string' ? (get('ex_class') as string) : null,
    properties: properties ?? {},
  };
}

/** The district key as text: layers store it as a number or a string; anything else is none. */
function districtKey(value: unknown): string | null {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && value !== '') return value;
  return null;
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
