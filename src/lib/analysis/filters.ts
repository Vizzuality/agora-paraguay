import type { AnalysisOption, AnalysisOptions } from '@/lib/api/schemas';

/**
 * The analysis hero dropdowns (AGP-29). The public hero (riesgo sanitario) shows the
 * first four; the private one (riesgo productivo) shows the two period bounds.
 */
export type AnalysisFilterKey =
  | 'fechaSiembra'
  | 'fechaAnalisis'
  | 'cultivo'
  | 'ciclo'
  | 'fechaInicio'
  | 'fechaFin';

/** What the user picked. `null` is "not chosen yet" — the default comes from the options. */
export type AnalysisFilters = Record<AnalysisFilterKey, string | null>;

/** What the dropdowns display: every filter resolved to a value present in its options. */
export type ResolvedAnalysisFilters = Record<AnalysisFilterKey, string>;

export const EMPTY_ANALYSIS_FILTERS: AnalysisFilters = {
  fechaSiembra: null,
  fechaAnalisis: null,
  cultivo: null,
  ciclo: null,
  fechaInicio: null,
  fechaFin: null,
};

/** The option list a filter picks from. Both period bounds share `periodo`. */
export function optionsFor(key: AnalysisFilterKey, options: AnalysisOptions): AnalysisOption[] {
  switch (key) {
    case 'fechaSiembra':
      return options.fechasSiembra;
    case 'fechaAnalisis':
      return options.fechasAnalisis;
    case 'cultivo':
      return options.cultivos;
    case 'ciclo':
      return options.ciclos;
    case 'fechaInicio':
    case 'fechaFin':
      return options.periodo;
  }
}

/** The values a filter may take, in option order. */
export function optionValues(key: AnalysisFilterKey, options: AnalysisOptions): string[] {
  return optionsFor(key, options).map((option) => option.value);
}

/** Where a filter lands when nothing valid is chosen: the first option, except the period end. */
function defaultValue(key: AnalysisFilterKey, values: string[]): string {
  return key === 'fechaFin' ? values[values.length - 1] : values[0];
}

/**
 * Turns the stored selection into what the dropdowns show. Runs on every render of the
 * hero, against whatever the options query returned: a pick that is no longer offered
 * falls back to the default rather than leaving the select blank.
 */
export function resolveAnalysisFilters(
  selected: AnalysisFilters,
  options: AnalysisOptions,
): ResolvedAnalysisFilters {
  const keys = Object.keys(EMPTY_ANALYSIS_FILTERS) as AnalysisFilterKey[];
  const resolved = Object.fromEntries(
    keys.map((key) => {
      const values = optionValues(key, options);
      const pick = selected[key];

      return [key, pick !== null && values.includes(pick) ? pick : defaultValue(key, values)];
    }),
  ) as ResolvedAnalysisFilters;

  // ISO `YYYY-MM-DD` values compare lexically, so the period end never precedes its start.
  if (resolved.fechaFin < resolved.fechaInicio) resolved.fechaFin = resolved.fechaInicio;

  return resolved;
}
