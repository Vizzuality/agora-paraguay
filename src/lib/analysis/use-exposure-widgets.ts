import { useAtomValue } from 'jotai';

import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicators } from '@/lib/analysis/indicator-picker';
import { useIndicators } from '@/lib/analysis/use-indicators';
import { asDistrictParcel } from '@/lib/map/exposure-districts';
import { selectedIndicatorIdsAtom } from '@/store/analysis';
import { selectedDistrictAtom } from '@/store/exposure';

const RIESGO = 'exposicion_climatica';

/** Already the panel's heading: not repeated as facts. */
const SHOWN_IN_HEADER = new Set(['DPTO_DESC', 'DIST_DESC_']);

/**
 * The exposure indicators Personalizar indicadores offers: the measured ones, as on the
 * riesgo pages. `undefined` until the list loads. Reads atoms: render inside `<ClientOnly>`.
 */
export function useExposureIndicators() {
  const indicators = useIndicators(RIESGO);
  const selectable = indicators.data
    ? selectableIndicators(indicators.data, RIESGO).filter(
        (indicator) => !SHOWN_IN_HEADER.has(indicator.id),
      )
    : undefined;

  return { indicators, selectable };
}

/**
 * What the Exposición climática panel renders for the picked district, through the same
 * widgets as the riesgo pages: the district is the parcel, its layer properties the
 * readings. Its percentages chart on 0–100 and its exposure class on the ruler; its
 * hectares are facts (`widgetFor`). The facts are the ones the metadata marks default; the
 * widgets follow Personalizar indicadores. Reads atoms, so callers render inside
 * `<ClientOnly>`.
 */
export function useExposureWidgets() {
  const { indicators, selectable } = useExposureIndicators();
  const district = useAtomValue(selectedDistrictAtom);
  const selected = useAtomValue(selectedIndicatorIdsAtom)[RIESGO];

  const facts = new Set(
    indicators.data
      ?.filter((indicator) => indicator.default && !SHOWN_IN_HEADER.has(indicator.id))
      .map((indicator) => indicator.id),
  );
  const shown = selectable ? visibleIndicators(selectable, selected) : undefined;
  const parcel = district ? asDistrictParcel(district) : null;
  // Percentages have a fixed scale, so the district alone is the set.
  const set = parcel ? [parcel] : [];

  const info = generalInfo(parcel, indicators.data, RIESGO).filter((row) => facts.has(row.id));
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
