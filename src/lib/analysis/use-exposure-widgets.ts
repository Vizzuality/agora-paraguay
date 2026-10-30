import { useAtomValue } from 'jotai';

import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { useIndicators } from '@/lib/analysis/use-indicators';
import { asDistrictParcel } from '@/lib/map/exposure-districts';
import { selectedDistrictAtom } from '@/store/exposure';

const RIESGO = 'exposicion_climatica';

/** Already the panel's heading: not repeated as facts. */
const SHOWN_IN_HEADER = new Set(['DPTO_DESC', 'DIST_DESC_']);

/**
 * What the Exposición climática panel renders for the picked district, through the same
 * widgets as the riesgo pages: the district is the parcel, its layer properties the
 * readings. Its percentages chart on 0–100 and its exposure class on the ruler; its
 * hectares are facts (`widgetFor`). Only the indicators the metadata marks default show. Reads atoms, so callers render inside
 * `<ClientOnly>`.
 */
export function useExposureWidgets() {
  const indicators = useIndicators(RIESGO);
  const district = useAtomValue(selectedDistrictAtom);

  const shown = indicators.data?.filter(
    (indicator) => indicator.default && !SHOWN_IN_HEADER.has(indicator.id),
  );
  const shownIds = new Set(shown?.map((indicator) => indicator.id));
  const parcel = district ? asDistrictParcel(district) : null;
  // Percentages have a fixed scale, so the district alone is the set.
  const set = parcel ? [parcel] : [];

  const info = generalInfo(parcel, indicators.data, RIESGO).filter((row) => shownIds.has(row.id));
  const widgets = analysisWidgets({
    parcels: set,
    parcelIds: set.map((entry) => String(entry.parcel_id)),
    indicators: shown,
    riesgo: RIESGO,
    scope: 'individual',
    parcel,
  });

  return { indicators, district, info, widgets };
}
