import { useMemo } from 'react';

import { globalLayerVectorUrl } from '@/lib/api/parcels/queries';

/**
 * A reference layer's GeoJSON source by id (`global_layer_vector`): the URL, which
 * MapLibre fetches and parses off the main thread. Not a query: the layers are too big
 * to parse in the page and hold in the query cache.
 */
export function useGetGlobalLayer(id: number): string {
  return useMemo(() => globalLayerVectorUrl(id), [id]);
}
