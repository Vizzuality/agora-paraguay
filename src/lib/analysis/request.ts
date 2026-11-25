import { cropOfIndicator } from '@/lib/analysis/applicable-indicators';
import { isAreaIndicator } from '@/lib/analysis/area';
import {
  CROP_FILTER_ID,
  YEAR_FILTER_ID,
  type AnalysisFilterSelection,
} from '@/lib/analysis/filters';
import { isGeneralInfo } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicatorIds } from '@/lib/analysis/indicator-picker';
import { ALL_CROPS } from '@/lib/analysis/parcel-crops';
import type {
  AnalysisRequest,
  AnalysisVisibility,
  SummaryRequest,
} from '@/lib/api/analysis/schemas';
import {
  type Crop,
  CROP_WIRE_VALUES,
  CROPS,
  isCrop,
  type Indicators,
  type Riesgo,
  toWireCrop,
} from '@/lib/api/metadata/schemas';

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
        isGeneralInfo(indicator, riesgo, 'multiple') ||
        isAreaIndicator(indicator) ||
        visible.has(indicator.id),
    )
    .map((indicator) => indicator.id);
}

/** The year the diseases analysis (sanitario) is always asked for; its hero has no year. */
export const DISEASES_YEAR = '2025';

/**
 * The selection as picked in the hero (filter id → value), the parcels and the
 * indicators, flat. The crop goes under its wire name (`toWireCrop`); Todos sends none.
 * Sanitario adds `DISEASES_YEAR`.
 */
export function toAnalysisRequest(
  parcelIds: string[],
  selection: AnalysisFilterSelection,
  indicators: string[],
  riesgo?: Riesgo,
): AnalysisRequest {
  const { [CROP_FILTER_ID]: crop, ...rest } = selection;
  const filters: Record<string, string> = { ...rest };

  if (crop !== undefined && crop !== ALL_CROPS) filters[CROP_FILTER_ID] = toWireCrop(crop);
  if (riesgo === 'sanitario') filters[YEAR_FILTER_ID] = DISEASES_YEAR;

  return { ...filters, parcels: parcelIds, indicators };
}

/**
 * The analysis runs for the hero's selection. Productivo under Todos asks once per crop
 * (the production analysis reads one crop): every parcel, that crop's indicators and the
 * ones every crop shares; the answers merge per parcel (`mergeAnalysisResponses`). Anything
 * else is one run.
 */
export function toAnalysisRequests(
  parcelIds: string[],
  selection: AnalysisFilterSelection,
  indicatorIds: string[],
  indicators: Indicators,
  riesgo: Riesgo,
): AnalysisRequest[] {
  if (riesgo !== 'productivo' || selection[CROP_FILTER_ID] !== ALL_CROPS) {
    return [toAnalysisRequest(parcelIds, selection, indicatorIds, riesgo)];
  }

  const cropOf = new Map(indicators.map((indicator) => [indicator.id, cropOfIndicator(indicator)]));

  return CROPS.map((crop) =>
    toAnalysisRequest(
      parcelIds,
      { ...selection, [CROP_FILTER_ID]: crop },
      indicatorIds.filter((id) => (cropOf.get(id) ?? crop) === crop),
      riesgo,
    ),
  );
}

/** The order Todos asks for its summaries in, and so the order they read in. */
const SUMMARY_CROPS: readonly Crop[] = ['soja', 'rice'];

/**
 * The AI summary's bodies: the hero's year and crop (under its wire name), and the parcels
 * in view — the open tab's parcel alone, or under Todas (`activeId` null) every analysed
 * one. A summary reads one crop, so Todos asks once per crop, soy first. `null` until
 * there is something to summarise — no parcels, or the filters not resolved to a year and
 * a known crop yet.
 */
export function toSummaryRequests(
  parcelIds: string[],
  activeId: string | null,
  selection: AnalysisFilterSelection | null,
): SummaryRequest[] | null {
  const picked = selection?.[CROP_FILTER_ID];
  const year = selection?.[YEAR_FILTER_ID];
  const parcels = activeId === null ? parcelIds : [activeId];
  const crops = picked === ALL_CROPS ? SUMMARY_CROPS : isCrop(picked) ? [picked] : [];

  if (parcels.length === 0 || crops.length === 0 || !year) return null;

  return crops.map((crop) => ({ parcels, year, crop_type: CROP_WIRE_VALUES[crop] }));
}

function isSameSummaryRequest(asked: SummaryRequest, current: SummaryRequest): boolean {
  return (
    asked.crop_type === current.crop_type &&
    asked.year === current.year &&
    asked.parcels.length === current.parcels.length &&
    asked.parcels.every((id, index) => id === current.parcels[index])
  );
}

/** Whether summaries asked with `asked` still describe `current`: same parcels, year and crops. */
export function isSameSummaryRequests(
  asked: SummaryRequest[] | undefined,
  current: SummaryRequest[] | null,
): boolean {
  if (!asked || !current || asked.length !== current.length) return false;

  return asked.every((request, index) => isSameSummaryRequest(request, current[index]));
}
