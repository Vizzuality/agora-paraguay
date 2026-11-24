import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { requestedIndicatorIds, toAnalysisRequests, visibilityOf } from '@/lib/analysis/request';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import { useIndicators } from '@/lib/analysis/use-indicators';
import { useParcelCrops } from '@/lib/analysis/use-parcel-crops';
import { analysisQueries } from '@/lib/api/analysis/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysedParcelIdsAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/**
 * The analysis behind /analisis, assembled from what the user chose: the parcels Analizar
 * submitted (`analysedParcelIdsAtom`), the hero filters and the indicators the picker
 * shows. Any of them changing re-runs the POST (`analysisQueries.result`). Every filter
 * always has a value (`resolveFilterSelection`), so the run waits only for the two lists.
 * Reads atoms, so callers render inside `<ClientOnly>`.
 */
export function useAnalysis(riesgo: Riesgo) {
  const visibility = visibilityOf(riesgo);
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const selectedIndicators = useAtomValue(selectedIndicatorIdsAtom)[riesgo];

  const { resolvedFilters } = useHeroFilters(riesgo);
  const indicators = useIndicators(riesgo);
  const { byParcel } = useParcelCrops();
  const requests =
    resolvedFilters !== null && indicators.data !== undefined && parcelIds.length > 0
      ? toAnalysisRequests(
          parcelIds,
          resolvedFilters,
          requestedIndicatorIds(indicators.data, selectedIndicators, riesgo),
          indicators.data,
          riesgo,
          byParcel,
        )
      : null;

  const analysis = useQuery(analysisQueries.result(visibility, requests));

  return {
    analysis,
    indicators: indicators.data,
    indicatorsError: indicators.error,
    parcelIds,
  };
}
