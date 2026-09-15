import { isGeneralInfo } from '@/lib/analysis/indicator-cards';
import type { Indicator, Indicators } from '@/lib/api/metadata/schemas';

/*
 * Personalizar indicadores: which indicators the analysis page shows. Pure, node-tested.
 * The user's picks live in `src/store/analysis.ts`; `null` there means "the API's
 * defaults", so a metadata change is followed until the user touches the list.
 */

/**
 * What the picker offers: the measured indicators only. The general-info facts (station,
 * crop, phenology) are always on the page and never in the list.
 */
export function pickableIndicators(indicators: Indicators): Indicators {
  return indicators.filter((indicator) => !isGeneralInfo(indicator));
}

/** The ids shown: the user's picks, else the indicators the API flags `default`, else all. */
export function visibleIndicatorIds(indicators: Indicators, picked: string[] | null): string[] {
  if (picked !== null) return picked;

  const defaults = indicators.filter((indicator) => indicator.default === true);

  return (defaults.length > 0 ? defaults : indicators).map((indicator) => indicator.id);
}

/** The indicators to render, in metadata order, restricted to the visible ids. */
export function visibleIndicators(indicators: Indicators, picked: string[] | null): Indicators {
  const visible = new Set(visibleIndicatorIds(indicators, picked));

  return indicators.filter((indicator) => visible.has(indicator.id));
}

/** Adds or removes `id` from the visible set, materialising the defaults on the first pick. */
export function toggleIndicatorId(
  indicators: Indicators,
  picked: string[] | null,
  id: string,
): string[] {
  const current = visibleIndicatorIds(indicators, picked);

  return current.includes(id) ? current.filter((other) => other !== id) : [...current, id];
}

/**
 * Whether the search box text matches the indicator: a substring of its name or id,
 * ignoring case and accents so "asiatica" finds "Roya asiática". Blank matches all.
 */
export function matchesIndicator(indicator: Indicator, query: string): boolean {
  const needle = fold(query);

  return (
    needle === '' || fold(indicator.name).includes(needle) || fold(indicator.id).includes(needle)
  );
}

/** Lower-case, accents stripped, trimmed — the comparison form for search. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
