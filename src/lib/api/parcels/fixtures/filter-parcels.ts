import type { FilterParcelsResponse } from '@/lib/api/parcels/schemas';

/**
 * TODO(mock-filter-parcels): the spec's example response, served for every request
 * while `filter_parcels` is not live. Delete with the mock branch in `client.ts`.
 */
export const filterParcelsFixture: FilterParcelsResponse = {
  status: 'success',
  message: '',
  input: { features: [{ id: 0 }, { id: 1 }] },
  results: [
    { parcel_id: 8668, geometry: { type: 'FeatureCollection', features: [] }, selected: true },
    { parcel_id: 7866, geometry: { type: 'FeatureCollection', features: [] }, selected: false },
  ],
};
