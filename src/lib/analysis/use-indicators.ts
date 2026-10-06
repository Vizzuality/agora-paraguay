import { useQuery } from '@tanstack/react-query';

import { asDeviationIndicators } from '@/lib/analysis/deviation-override';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/**
 * TODO(api-filters): once the API filters the list itself, key this query by the hero
 * filters (`useHeroFilters`, the crop at least) and pass them as query parameters, so the
 * list follows them like the analysis does — and drop `applicable-indicators.ts`.
 *
 * The riesgo's indicator list, asked once per riesgo and shared by the page, the picker
 * and the hero (same key). It does not follow the hero filters yet: the crop reaches the
 * API in the analysis request, which is what re-runs on a crop change. The deviations the
 * live list types as plain numbers are retyped on the way out (`asDeviationIndicators`,
 * TODO(api-deviation)); the cache keeps the list as the API wrote it.
 */
export function useIndicators(riesgo: Riesgo) {
  return useQuery({ ...metadataQueries.indicators({ riesgo }), select: asDeviationIndicators });
}
