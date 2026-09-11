import { mutationOptions, queryOptions } from '@tanstack/react-query';

import type { DrawnPolygon } from '@/lib/map/draw-features';

import { fetchParcels, filterParcels } from './client';
import { toFilterParcelsRequest, type FilterParcelsOptions } from './schemas';

export const parcelQueries = {
  all: () =>
    queryOptions({
      queryKey: ['parcels'] as const,
      queryFn: fetchParcels,
      // TODO(mock-parcels): staleTime pinned to Infinity only because the fixture is
      // static — revisit when the layer is fed from `filter_parcels`.
      staleTime: Infinity,
    }),
};

/** Fired once a drawing is finished or an upload lands; the wire shape is built in `schemas.ts`. */
export const parcelMutations = {
  filter: () =>
    mutationOptions({
      mutationKey: ['parcels', 'filter'] as const,
      mutationFn: (variables: { polygons: DrawnPolygon[]; options?: FilterParcelsOptions }) =>
        filterParcels(toFilterParcelsRequest(variables.polygons, variables.options)),
    }),
};
