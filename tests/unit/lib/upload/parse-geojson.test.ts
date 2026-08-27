import { describe, expect, it } from 'vitest';

import { parseGeoJson } from '@/lib/upload/parse-geojson';
import { UploadError } from '@/lib/upload/types';

const SQUARE = [
  [
    [-57.6, -25.3],
    [-57.6, -25.2],
    [-57.5, -25.2],
    [-57.5, -25.3],
    [-57.6, -25.3],
  ],
];

describe('parseGeoJson', () => {
  it('rejects text that is not JSON', () => {
    expect(() => parseGeoJson('not json {{{')).toThrowError(UploadError);
    expect(() => parseGeoJson('not json {{{')).toThrowError(
      'No se pudo leer el archivo como GeoJSON',
    );
  });

  it('rejects JSON that is not GeoJSON', () => {
    expect(() => parseGeoJson(JSON.stringify({ type: 'Farm', polygons: [] }))).toThrowError(
      UploadError,
    );
  });

  it('parses a FeatureCollection with a MultiPolygon, exploding it', () => {
    const text = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: [SQUARE, SQUARE] },
          properties: { name: 'Estancia' },
        },
      ],
    });

    const { features, warnings } = parseGeoJson(text);

    expect(features.map((feature) => feature.properties.name)).toEqual([
      'Estancia (1/2)',
      'Estancia (2/2)',
    ]);
    expect(warnings).toEqual([]);
  });

  it('stamps the store properties on every feature', () => {
    const text = JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: SQUARE },
      properties: { name: 'Campo' },
    });

    const { features } = parseGeoJson(text);

    expect(features[0].properties).toEqual({ mode: 'polygon', origin: 'upload', name: 'Campo' });
  });
});
