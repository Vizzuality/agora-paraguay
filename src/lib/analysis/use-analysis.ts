import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { resolveFilterSelection } from '@/lib/analysis/filters';
import { requestedIndicatorIds, toAnalysisRequest, visibilityOf } from '@/lib/analysis/request';
import { analysisQueries } from '@/lib/api/analysis/queries';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import {
  analysedParcelIdsAtom,
  analysisFiltersAtom,
  selectedIndicatorIdsAtom,
} from '@/store/analysis';

/**
 * The analysis behind /analisis, assembled from what the user chose: the parcels Analizar
 * submitted (`analysedParcelIdsAtom`), the hero filters and the indicators the picker
 * shows. Any of them changing re-runs the POST (`analysisQueries.result`). Reads atoms,
 * so callers render inside `<ClientOnly>`.
 */
export function useAnalysis(riesgo: Riesgo) {
  const visibility = visibilityOf(riesgo);
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const selectedFilters = useAtomValue(analysisFiltersAtom);
  const selectedIndicators = useAtomValue(selectedIndicatorIdsAtom);

  const filters = useQuery(metadataQueries.filters({ visibility }));
  const resolvedFilters = filters.data
    ? resolveFilterSelection(selectedFilters, filters.data)
    : null;
  // TODO(filters-cultivo): the indicator list takes `cultivo`; `crop_type` is the filter that holds it.
  const indicators = useQuery(
    metadataQueries.indicators(
      riesgo === 'sanitario' ? { riesgo, cultivo: resolvedFilters?.crop_type } : { riesgo },
    ),
  );

  const request =
    resolvedFilters !== null && indicators.data !== undefined && parcelIds.length > 0
      ? toAnalysisRequest(
          parcelIds,
          resolvedFilters,
          requestedIndicatorIds(indicators.data, selectedIndicators),
        )
      : null;

  const analysis = useQuery(analysisQueries.result(visibility, request));

  return { analysis, indicators: indicators.data, parcelIds };
}
