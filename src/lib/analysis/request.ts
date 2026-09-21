import type { AnalysisFilterSelection } from '@/lib/analysis/filters';
import { isGeneralInfo } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicatorIds } from '@/lib/analysis/indicator-picker';
import type { AnalysisRequest, AnalysisVisibility } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * Builds the `POST /api/parcels/analysis/{diseases|production}/` body out of app state —
 * pure, node-tested. The hero selection is already keyed by the API's filter ids, so it
 * goes on the wire as is, flat, with the parcel and indicator lists beside it.
 */

/** Which analysis path serves a riesgo tab: sanitario is public, productivo private. */
export function visibilityOf(riesgo: Riesgo): AnalysisVisibility {
  return riesgo === 'sanitario' ? 'public' : 'private';
}

/**
 * The indicator ids to ask the analysis for: the general-info facts (always on the page)
 * plus the measured ones the picker shows — the user's selection, else the API's
 * defaults. Metadata order.
 */
export function requestedIndicatorIds(indicators: Indicators, selected: string[] | null): string[] {
  const visible = new Set(visibleIndicatorIds(selectableIndicators(indicators), selected));

  return indicators
    .filter((indicator) => isGeneralInfo(indicator) || visible.has(indicator.id))
    .map((indicator) => indicator.id);
}

/** The selection as picked in the hero (filter id → value), the parcels and the indicators, flat. */
export function toAnalysisRequest(
  parcelIds: string[],
  selection: AnalysisFilterSelection,
  indicators: string[],
): AnalysisRequest {
  return { ...selection, parcels: parcelIds, indicators };
}
