import { env } from '@/env';
import { postJson } from '@/lib/api/http';

import {
  filterParcelsRequestSchema,
  filterParcelsResponseSchema,
  parcelCollectionSchema,
  type FilterParcelsRequest,
  type FilterParcelsResponse,
  type ParcelCollection,
} from './schemas';

/*
 * The only module in `parcels/` that knows which data is fake: both the cadastral layer
 * (`fetchParcels`) and `filterParcels` run on the mock branch until the API is live.
 *
 * Responses are parsed through the Zod schemas in both branches on purpose: it keeps
 * the fixtures honest, and it makes contract drift surface as a parse error at the
 * boundary instead of an `undefined` deep in a component.
 */

/**
 * TODO(mock-parcels): the mock branch serves generated fixtures. The spec has no "all
 * parcels" endpoint; delete this and `fixtures/parcels.ts` when the layer is fed from
 * `filter_parcels` results (grep `mock-parcels`).
 *
 * The fixture module is lazy-imported so generation cost stays off the critical
 * path — the same rule the upload parsers follow with their libraries.
 */
export async function fetchParcels(): Promise<ParcelCollection> {
  if (env.VITE_USE_MOCK_API) {
    const { parcelFixtures } = await import('./fixtures/parcels');

    return parcelCollectionSchema.parse(parcelFixtures);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/** As written in the spec — no trailing slash, unlike the auth endpoints. */
export const FILTER_PARCELS_PATH = '/api/parcels/filter_parcels';

/**
 * POSTs the drawn or uploaded polygons and gets back the cadastral parcels around them,
 * with the ones over the overlap threshold flagged. The request is parsed at the
 * boundary in both branches, so the body the mock accepts is the body the API gets.
 *
 * TODO(mock-filter-parcels): the mock branch answers the spec's example for any
 * polygons; drop it when the endpoint is live (grep `mock-filter-parcels`).
 */
export async function filterParcels(request: FilterParcelsRequest): Promise<FilterParcelsResponse> {
  const parsed = filterParcelsRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    const { filterParcelsFixture } = await import('./fixtures/filter-parcels');

    return filterParcelsResponseSchema.parse(filterParcelsFixture);
  }

  return filterParcelsResponseSchema.parse(await postJson(FILTER_PARCELS_PATH, parsed));
}
