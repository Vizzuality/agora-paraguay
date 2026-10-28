import { useQuery } from '@tanstack/react-query';

import { layerQueries } from '@/lib/api/layers/queries';

/** The country-wide layers from `global_layers/`, shared by every consumer (same key). */
export function useGetGlobalLayers() {
  return useQuery(layerQueries.global());
}
