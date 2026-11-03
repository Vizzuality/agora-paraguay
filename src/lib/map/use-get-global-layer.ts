import { useMemo } from 'react';

import { globalLayerTilesUrl } from '@/lib/api/layers/queries';

/**
 * A reference layer's tile template by id (`global_layer_tiles`), which MapLibre fetches
 * tile by tile. Not a query: MapLibre loads and caches the tiles itself. Reads
 * `window.location`, so callers render inside `<ClientOnly>`.
 */
export function useGetGlobalLayer(id: number): string {
  return useMemo(() => globalLayerTilesUrl(id, window.location.origin), [id]);
}
