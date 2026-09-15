import type { AnalysisResponse } from '@/lib/api/analysis/schemas';

/**
 * TODO(mock-analysis): stand-in for `POST /api/analysis/public` while the endpoint is
 * not reachable. Delete with the mock branch in `client.ts`.
 *
 * Shape follows the backend's sample (`AGORA_Public-part_Backend2Frontend-sample_20260909`):
 * one Feature per analysed parcel, the `disease_indices` as property columns, geometry in
 * EPSG:32721 (UTM 21S) as delivered. Three parcels with different readings so switching
 * the hero's parcel tab visibly changes the cards. Disease indices run 1–3 per the
 * indicators metadata.
 */
export const analysisFixture: AnalysisResponse = {
  type: 'FeatureCollection',
  name: 'AGORA_Database_Public_Draft_20260909',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::32721' } },
  features: [
    parcel({
      parcela_id: 'D07D21P00000001',
      fid: 2161,
      area: 18025.55,
      weather_station: 'Colonias Unidas - Capitán Meza',
      data_quality: 92,
      phenology_stage: 'R5 (Inicio de grano)',
      asian_rust: 3,
      brown_spot: 2,
      origin: [676462.8, 7077914.9],
    }),
    parcel({
      parcela_id: 'D07D21P00000002',
      fid: 2162,
      area: 42310.12,
      weather_station: 'Colonias Unidas - Capitán Meza',
      data_quality: 92,
      phenology_stage: 'R3 (Inicio de vaina)',
      asian_rust: 1,
      brown_spot: 1,
      origin: [676612.8, 7077914.9],
    }),
    parcel({
      parcela_id: 'D07D23P00000169',
      fid: 235,
      area: 174090.92,
      weather_station: 'Hohenau',
      data_quality: 78,
      phenology_stage: 'R5 (Inicio de grano)',
      asian_rust: 2,
      brown_spot: 3,
      origin: [651092.8, 7073894.9],
    }),
  ],
};

type ParcelReading = {
  parcela_id: string;
  fid: number;
  area: number;
  weather_station: string;
  data_quality: number;
  phenology_stage: string;
  asian_rust: number;
  brown_spot: number;
  /** South-west corner, UTM 21S metres; the parcel is a 100 m square from there. */
  origin: [number, number];
};

function parcel({
  origin: [x, y],
  ...properties
}: ParcelReading): AnalysisResponse['features'][number] {
  return {
    type: 'Feature',
    properties: { ...properties, crop_type: 'Soja' },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [x, y],
            [x + 100, y],
            [x + 100, y + 100],
            [x, y + 100],
            [x, y],
          ],
        ],
      ],
    },
  };
}
