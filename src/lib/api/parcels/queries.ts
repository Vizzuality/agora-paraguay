import { queryOptions } from '@tanstack/react-query';

import { areasSignature } from '@/lib/map/areas-signature';
import type { DrawnPolygon } from '@/lib/map/draw-features';

import { filterParcels } from './client';
import {
  DEFAULT_FILTER_PARCELS_OPTIONS,
  toFilterParcelsRequest,
  type FilterParcelsOptions,
} from './schemas';

export const parcelQueries = {
  /**
   * The cadastral parcels around the drawn or uploaded polygons (`filter-parcels`),
   * fetched as soon as a drawing is finished or an upload lands. A query, not a
   * mutation: the answer is a function of the geometry, so it is keyed by it, refetches
   * when a polygon is edited, and is reused by Analizar instead of asked again.
   * Disabled with nothing on the map (the wire schema rejects an empty list) and with
   * areas over `MAX_AREA_HECTARES`: a drawing that size is rejected before any request
   * (`useRejectOversizedAreas`); an upload that size never lands (`normalize.ts`).
   */
  filtered: (
    polygons: DrawnPolygon[],
    options: FilterParcelsOptions = DEFAULT_FILTER_PARCELS_OPTIONS,
  ) => {
    const { key, oversized } = areasSignature(polygons);

    return queryOptions({
      queryKey: ['parcels', 'filter', key, options] as const,
      queryFn: ({ signal }) => filterParcels(toFilterParcelsRequest(polygons, options), signal),
      enabled: polygons.length > 0 && !oversized,
      staleTime: Infinity,
      // A geometry change (a vertex drag, a restore after /analisis) re-keys the query;
      // the parcels already on the map stay painted until the new answer lands instead
      // of vanishing for the round trip. Not when the geometry is gone (Reiniciar): the
      // disabled query would otherwise keep handing the old parcels to a layer that is
      // still mounted, and they would stay on the map.
      placeholderData: (previous) => (polygons.length > 0 ? previous : undefined),
    });
  },
};
