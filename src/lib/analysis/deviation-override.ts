import type { Indicator, Indicators } from '@/lib/api/metadata/schemas';

/*
 * TODO(api-deviation): remove this file, its test and the `select` in `use-indicators.ts`
 * once the API types the deviation indicators itself (`indicator_type.type: 'deviation'`,
 * with `base` naming the reference indicator).
 *
 * The live list writes every productivo number as `numeric`, the deviations from the
 * historical base included (`Des_soja`, `Des_arroz`, …). Those are signed differences
 * and get the diverging widget, so until the backend says so the client retypes them by
 * their id prefix, the base being the production indicator of the same crop (`Pro_soja`
 * for `Des_soja`). Pure, node-tested.
 *
 * TODO(risk): this is a stopgap, and a fragile one. It guesses meaning from the spelling
 * of ids — a new `Des_*` that is not a deviation, a base renamed away from `Pro_*`, or a
 * change of case all break it silently, and `Des_soja` is itself documented as a standard
 * deviation. Replace it with one of: (a) richer indicator types from the API (preferred:
 * the type says what it is and which indicator it is measured from); or (b) an explicit,
 * reviewed list of ids per case (`{ Des_soja: 'Pro_soja', … }`) that names known
 * indicators rather than pattern-matching on them. Do not grow the prefix rule.
 */

/** The id prefix of a deviation indicator in the live list. */
const DEVIATION_PREFIX = /^Des_/i;

/** The prefix of the indicator a deviation is measured from: the crop's base production. */
const BASE_PREFIX = 'Pro_';

/** Whether the live list's id names a deviation from the base. */
export function isDeviationId(id: string): boolean {
  return DEVIATION_PREFIX.test(id);
}

/** The id of the base a deviation is measured from: `Des_soja` → `Pro_soja`. */
export function baseIdOf(id: string): string {
  return id.replace(DEVIATION_PREFIX, BASE_PREFIX);
}

/**
 * The list with every open number whose id says deviation retyped as one, its base the
 * crop's production. Anything else — a range, a category, text, an id outside the prefix
 * — is left as it came, the backend's own `deviation` type included.
 */
export function asDeviationIndicators(indicators: Indicators): Indicators {
  return indicators.map(retype);
}

function retype(indicator: Indicator): Indicator {
  const { type } = indicator.indicator_type;

  if (!isDeviationId(indicator.id) || (type !== 'numeric' && type !== 'number')) return indicator;

  return { ...indicator, indicator_type: { type: 'deviation', base: baseIdOf(indicator.id) } };
}
