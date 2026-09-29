import { useQuery } from '@tanstack/react-query';

import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/**
 * The riesgo's indicator list, asked once per riesgo and shared by the page, the picker
 * and the hero (same key). It does not follow the hero filters: the crop reaches the API
 * in the analysis request, which is what re-runs on a crop change.
 */
export function useIndicators(riesgo: Riesgo) {
  return useQuery(metadataQueries.indicators({ riesgo }));
}
