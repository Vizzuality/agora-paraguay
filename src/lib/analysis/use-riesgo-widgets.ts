import { useAtomValue } from 'jotai';

import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import { combinedParcel } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicators } from '@/lib/analysis/indicator-picker';
import { useApplicableIndicators } from '@/lib/analysis/use-applicable-indicators';
import { useDescribe } from '@/lib/analysis/use-describe';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { activeParcelIdAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/**
 * What a riesgo page renders for the hero's open tab (`activeParcelIdAtom`): the parcel
 * behind the tab — or, under Todas, the set combined (`combinedParcel`) — and one widget
 * per indicator the picker shows, in metadata order, with its description resolved.
 * Changing the picker or the hero filters re-runs the analysis (`useAnalysis`); the
 * previous widgets stay until the new answer lands. The answer is matched by id, since the
 * backend need not echo the parcels in request order. Reads atoms, so callers render
 * inside `<ClientOnly>`.
 */
export function useRiesgoWidgets(riesgo: Riesgo) {
  const { analysis, indicators, indicatorsError, parcelIds } = useApplicableIndicators(riesgo);
  const activeId = useAtomValue(activeParcelIdAtom);
  const selected = useAtomValue(selectedIndicatorIdsAtom)[riesgo];
  const describe = useDescribe(riesgo);

  const answered = analysis.data?.indicators ?? [];
  const scope = activeId === null ? 'multiple' : 'individual';
  const parcel =
    activeId === null
      ? combinedParcel(
          answered.filter((entry) => parcelIds.includes(String(entry.parcel_id))),
          indicators,
        )
      : answered.find((entry) => String(entry.parcel_id) === activeId);
  const shown = indicators
    ? visibleIndicators(selectableIndicators(indicators, riesgo), selected)
    : undefined;
  const widgets = analysisWidgets({
    parcels: answered,
    parcelIds,
    indicators: shown,
    riesgo,
    scope,
    parcel,
  }).map((widget) => ({ ...widget, description: describe(widget.description) }));

  return { analysis, indicators, indicatorsError, parcelIds, parcel, widgets, describe };
}
