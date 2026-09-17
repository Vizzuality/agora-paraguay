import { mutationOptions, queryOptions } from '@tanstack/react-query';

import type { DrawnPolygon } from '@/lib/map/draw-features';

import { fetchParcelDiseases, filterParcels } from './client';
import {
  DEFAULT_FILTER_PARCELS_OPTIONS,
  toFilterParcelsRequest,
  type FilterParcelsOptions,
  type ParcelDiseasesRequest,
} from './schemas';

export const parcelQueries = {
  /**
   * The cadastral parcels around the drawn or uploaded polygons (`filter_parcels`),
   * fetched as soon as a drawing is finished or an upload lands. A query, not a
   * mutation: the answer is a function of the geometry, so it is keyed by it, refetches
   * when a polygon is edited, and is reused by Analizar instead of asked again.
   * Disabled with nothing on the map (the wire schema rejects an empty list).
   */
  filtered: (
    polygons: DrawnPolygon[],
    options: FilterParcelsOptions = DEFAULT_FILTER_PARCELS_OPTIONS,
  ) =>
    queryOptions({
      queryKey: [
        'parcels',
        'filter',
        polygons.map((polygon) => ({ id: polygon.id, geometry: polygon.geometry })),
        options,
      ] as const,
      queryFn: () => filterParcels(toFilterParcelsRequest(polygons, options)),
      enabled: polygons.length > 0,
      staleTime: Infinity,
    }),
};

export const parcelMutations = {
  /** Disease indices for the given parcels; a POST the user triggers, never refetched on focus. */
  diseases: () =>
    mutationOptions({
      mutationKey: ['parcels', 'diseases'] as const,
      mutationFn: (request: ParcelDiseasesRequest) => fetchParcelDiseases(request),
    }),
};
