import { isAreaIndicator } from '@/lib/analysis/area';
import { CROP_FILTER_ID, type AnalysisFilterSelection } from '@/lib/analysis/filters';
import { isGeneralInfo } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicatorIds } from '@/lib/analysis/indicator-picker';
import type {
  AnalysisRequest,
  AnalysisVisibility,
  SummaryRequest,
} from '@/lib/api/analysis/schemas';
import { isCrop, type Indicators, type Riesgo } from '@/lib/api/metadata/schemas';

/*
 * Builds the `POST /api/parcels/analysis/{diseases|production}/` body out of app state —
 * pure, node-tested. The hero selection is already keyed by the API's filter ids, so it
 * goes on the wire as is, flat, with the parcel and indicator lists beside it.
 */

/** Productivo's year filter, which the AI summary requires. */
const YEAR_FILTER_ID = 'year';

/** Which analysis path serves a riesgo tab: sanitario is public, productivo private. */
export function visibilityOf(riesgo: Riesgo): AnalysisVisibility {
  return riesgo === 'sanitario' ? 'public' : 'private';
}

/**
 * The indicator ids to ask the analysis for: the general-info facts and the area (always
 * on the page) plus the measured ones the picker shows — the user's selection, else the
 * API's defaults. Metadata order.
 */
export function requestedIndicatorIds(
  indicators: Indicators,
  selected: string[] | null,
  riesgo: Riesgo = 'sanitario',
): string[] {
  const visible = new Set(visibleIndicatorIds(selectableIndicators(indicators, riesgo), selected));

  return indicators
    .filter(
      (indicator) =>
        isGeneralInfo(indicator, riesgo) || isAreaIndicator(indicator) || visible.has(indicator.id),
    )
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

/**
 * The AI summary's body: the hero's year and crop, and the parcels in view —
 * the open tab's parcel alone, or under Todas (`activeId` null) every analysed one.
 * `null` until there is something to summarise — no parcels, or the filters not
 * resolved to a year and a known crop yet.
 */
export function toSummaryRequest(
  parcelIds: string[],
  activeId: string | null,
  selection: AnalysisFilterSelection | null,
): SummaryRequest | null {
  const crop = selection?.[CROP_FILTER_ID];
  const year = selection?.[YEAR_FILTER_ID];
  const parcels = activeId === null ? parcelIds : [activeId];

  if (parcels.length === 0 || !isCrop(crop) || !year) return null;

  return { parcels, year, crop_type: crop };
}
