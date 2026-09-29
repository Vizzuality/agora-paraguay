import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { unresolvedFilters } from '@/lib/analysis/filters';
import { requestedIndicatorIds, toAnalysisRequest, visibilityOf } from '@/lib/analysis/request';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import { useIndicators } from '@/lib/analysis/use-indicators';
import { analysisQueries } from '@/lib/api/analysis/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysedParcelIdsAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/**
 * The analysis behind /analisis, assembled from what the user chose: the parcels Analizar
 * submitted (`analysedParcelIdsAtom`), the hero filters and the indicators the picker
 * shows. Any of them changing re-runs the POST (`analysisQueries.result`). Not before every
 * filter has a value: the backend requires them all, and a date with no default is empty
 * until typed — `pending` names those, for the page to ask for them. Reads atoms, so
 * callers render inside `<ClientOnly>`.
 */
export function useAnalysis(riesgo: Riesgo) {
  const visibility = visibilityOf(riesgo);
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const selectedIndicators = useAtomValue(selectedIndicatorIdsAtom);

  const { filters, resolvedFilters } = useHeroFilters(riesgo);
  const indicators = useIndicators(riesgo);
  const pending =
    resolvedFilters !== null && filters.data
      ? unresolvedFilters(resolvedFilters, filters.data)
      : [];

  const request =
    resolvedFilters !== null &&
    pending.length === 0 &&
    indicators.data !== undefined &&
    parcelIds.length > 0
      ? toAnalysisRequest(
          parcelIds,
          resolvedFilters,
          requestedIndicatorIds(indicators.data, selectedIndicators, riesgo),
        )
      : null;

  const analysis = useQuery(analysisQueries.result(visibility, request));

  return {
    analysis,
    indicators: indicators.data,
    indicatorsError: indicators.error,
    parcelIds,
    pending,
  };
}
