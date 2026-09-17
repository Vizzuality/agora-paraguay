import { env } from '@/env';
import { postJson } from '@/lib/api/http';

import {
  filterParcelsRequestSchema,
  filterParcelsResponseSchema,
  parcelDiseasesRequestSchema,
  parcelDiseasesResponseSchema,
  type FilterParcelsRequest,
  type FilterParcelsResponse,
  type ParcelDiseasesRequest,
  type ParcelDiseasesResponse,
} from './schemas';

/*
 * The only module in `parcels/` that knows which data is fake. Today only auth talks to
 * the API: with `VITE_USE_MOCK_API` on (the default) both functions here serve their
 * fixture; off, they hit the backend.
 */

/** As written in the spec — no trailing slash, unlike the auth endpoints. */
export const FILTER_PARCELS_PATH = '/api/parcels/filter_parcels';

/**
 * POSTs the drawn or uploaded polygons and gets back the cadastral parcels around them,
 * with the ones over the overlap threshold flagged. The request is parsed at the
 * boundary in both branches, so the body the mock accepts is the body the API gets.
 *
 * TODO(mock-filter-parcels): the mock branch tiles fake parcels around the polygons it
 * is sent; drop it when the endpoint is live (grep `mock-filter-parcels`).
 */
export async function filterParcels(request: FilterParcelsRequest): Promise<FilterParcelsResponse> {
  const parsed = filterParcelsRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    const { mockFilterParcels } = await import('./fixtures/filter-parcels');

    return filterParcelsResponseSchema.parse(mockFilterParcels(parsed));
  }

  return filterParcelsResponseSchema.parse(await postJson(FILTER_PARCELS_PATH, parsed));
}

/** Trailing slash as Django routes it — without one the API answers 301. */
export const PARCEL_DISEASES_PATH = '/api/parcels/get-parcel-diseases/';

/**
 * POSTs the parcels to score and gets back one Feature per parcel with its disease
 * indices. Request and response both cross the Zod boundary, so a body the backend
 * rejects fails here, not as a 4xx.
 *
 * TODO(mock-parcel-diseases): the mock branch answers the analysis fixture for any
 * request; drop it when the endpoint is live (grep `mock-parcel-diseases`).
 */
export async function fetchParcelDiseases(
  request: ParcelDiseasesRequest,
): Promise<ParcelDiseasesResponse> {
  const parsed = parcelDiseasesRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    const { parcelDiseasesFixture } = await import('./fixtures/parcel-diseases');

    return parcelDiseasesResponseSchema.parse(parcelDiseasesFixture);
  }

  return parcelDiseasesResponseSchema.parse(await postJson(PARCEL_DISEASES_PATH, parsed));
}
