/**
 * TODO(mock-parcel-diseases): stand-in for `POST /api/parcels/get-parcel-diseases/`
 * while the endpoint is not reachable. Delete with the mock branch in `client.ts`.
 *
 * The endpoint answers the public disease scoring, the same FeatureCollection the
 * analysis fixture already models, so that fixture is reused rather than copied.
 */
export { analysisFixture as parcelDiseasesFixture } from '@/lib/api/analysis/fixtures/analysis';
