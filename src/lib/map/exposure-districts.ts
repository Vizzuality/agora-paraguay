import type { ExpressionSpecification } from 'maplibre-gl';

import {
  EXPOSURE_CLASS_INDICATOR,
  indicatorClasses,
  type RiskClass,
  type RiskTone,
} from '@/lib/analysis/widget-config';
import type { AnalysisParcel, ParcelValue } from '@/lib/api/analysis/schemas';
import type { IndicatorType } from '@/lib/api/metadata/schemas';
import type { Bounds } from '@/lib/map/area-bounds';
import { EXPOSURE_LAYER_ID, layerMetadata } from '@/lib/map/layer-metadata';

/** A district on the exposure layer, read from its feature's properties. */
export type ExposureDistrict = {
  id: string;
  name: string;
  department: string | null;
  /** `Ex_class` as the layer spells it ("Bajo", "Medio", "Alto"), when present. */
  exposure: string | null;
  /** Every property of the feature: the exposure indicators read their values here. */
  properties: Record<string, unknown>;
  /**
   * The whole district's box, measured on the map it was picked on, whose tiles are
   * loaded: the map that mounts in the other column after the pick has none yet.
   */
  bounds?: Bounds | null;
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

/** An exposure class's legend item (`global-layers.json`), matched without regard to case. */
function exposureItem(exposure: string) {
  const value = exposure.toLowerCase();

  return layerMetadata(EXPOSURE_LAYER_ID).legendItems.find(
    (item) => item.value.toLowerCase() === value,
  );
}

/** How the tooltip words a class; one the metadata does not list passes through. */
export function exposureLabel(exposure: string): string {
  return exposureItem(exposure)?.tooltip ?? exposure;
}

/** How the legend words a class, with its range; one the metadata does not list passes through. */
export function exposureLegendLabel(exposure: string): string {
  return exposureItem(exposure)?.label ?? exposure;
}

/** Until the metadata answers: the three classes the legend has always shown. */
const FALLBACK_CLASSES: readonly RiskClass[] = [
  { label: 'Bajo', tone: 'none' },
  { label: 'Medio', tone: 'elevated' },
  { label: 'Alto', tone: 'high' },
];

/**
 * The hex each ruler tone paints a district and its legend swatch with: the light-theme
 * chart values, in both themes. MapLibre cannot read the CSS tokens the widgets paint with.
 */
const TONE_HEX: Record<RiskTone, string> = {
  none: '#109704',
  low: '#2A7BF1',
  medium: '#657690',
  elevated: '#E06900',
  high: '#EC1919',
};

/** A district's fill at half its class colour, as the legend swatch; the outline stays solid. */
export const EXPOSURE_FILL_OPACITY = 0.5;

/** The width of every district's outline; the picked one is a pixel wider. */
export const EXPOSURE_LINE_WIDTH = 2;

/**
 * Each district in its class's colour, fill and outline alike: `Ex_class` matched to
 * `classes`, grey for a class not listed (or no classes at all, since match needs one).
 */
export function exposureColor(classes: readonly RiskClass[]): ExpressionSpecification | string {
  if (classes.length === 0) return TONE_HEX.medium;

  return [
    'match',
    ['get', 'Ex_class'],
    ...classes.flatMap(({ label, tone }) => [label, TONE_HEX[tone]]),
    TONE_HEX.medium,
  ] as unknown as ExpressionSpecification;
}

/** A class's legend swatch: its fill colour at the map's fill opacity, edged solid. */
export function exposureSwatch(tone: RiskTone): { fill: string; edge: string } {
  const alpha = Math.round(EXPOSURE_FILL_OPACITY * 255)
    .toString(16)
    .padStart(2, '0');

  return { fill: `${TONE_HEX[tone]}${alpha.toUpperCase()}`, edge: TONE_HEX[tone] };
}

/**
 * The exposure classes as the panel's ruler colours them: `Ex_class`'s categories from
 * the indicator metadata, on exposure's own scale (`indicatorClasses`).
 */
export function exposureClasses(
  indicators: readonly { id: string; indicator_type: IndicatorType }[] | undefined,
): readonly RiskClass[] {
  const type = indicators?.find(
    (indicator) => indicator.id.toLowerCase() === EXPOSURE_CLASS_INDICATOR,
  )?.indicator_type;

  return type?.type === 'category' && type.categories.length > 0
    ? indicatorClasses(EXPOSURE_CLASS_INDICATOR, type.categories)
    : FALLBACK_CLASSES;
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

/** Where the camera goes when the pick changes: back to the country, onto a box, or nowhere. */
export type DistrictFlight = { to: 'country' } | { to: 'district'; bounds: Bounds | null };

/**
 * The camera move for a pick going from `was` to `district`. A map that mounts with a
 * district already picked starts from `was = null`, so it frames the district too;
 * `bounds: null` leaves the caller to measure the district on its own tiles.
 */
export function districtFlight(
  was: string | null,
  district: Pick<ExposureDistrict, 'id' | 'bounds'> | null,
): DistrictFlight | null {
  const now = district?.id ?? null;
  if (now === was) return null;
  if (!district) return { to: 'country' };

  return { to: 'district', bounds: district.bounds ?? null };
}
