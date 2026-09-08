import { describe, expect, it } from 'vitest';

import type { UploadGeoJson } from '@/lib/upload/geojson-schema';
import { normalizeFeatures, normalizeUnknown } from '@/lib/upload/normalize';
import { UploadError } from '@/lib/upload/types';

/**
 * A closed square inside Paraguay offset by `at`, the smallest valid store polygon.
 * Anchored near Asunción because normalization rejects geometry outside the country.
 */
function square(at = 0): number[][] {
  const lng = -58 + at * 0.05;
  const lat = -24 + at * 0.05;

  return [
    [lng, lat],
    [lng, lat + 0.5],
    [lng + 0.5, lat + 0.5],
    [lng + 0.5, lat],
    [lng, lat],
  ];
}

function feature(geometry: unknown, properties: Record<string, unknown> = {}) {
  return { type: 'Feature', geometry, properties };
}

function collection(...features: unknown[]) {
  return { type: 'FeatureCollection', features } as UploadGeoJson;
}

function polygon(properties: Record<string, unknown> = {}, ...rings: number[][][]) {
  return feature(
    { type: 'Polygon', coordinates: rings.length > 0 ? rings : [square()] },
    properties,
  );
}

function code(run: () => unknown): string | null {
  try {
    run();
  } catch (error) {
    if (error instanceof UploadError) return error.code;

    throw error;
  }

  return null;
}

describe('MultiPolygon explosion', () => {
  it('explodes a MultiPolygon into independent polygons with (i/n) names', () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        feature(
          { type: 'MultiPolygon', coordinates: [[square(0)], [square(10)], [square(20)]] },
          { name: 'Estancia Norte' },
        ),
      ),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      'Estancia Norte (1/3)',
      'Estancia Norte (2/3)',
      'Estancia Norte (3/3)',
    ]);
    expect(features.every((item) => item.geometry.type === 'Polygon')).toBe(true);
    expect(warnings).toEqual([]);
  });

  it('keeps the plain name for a single-part MultiPolygon', () => {
    const { features } = normalizeFeatures(
      collection(feature({ type: 'MultiPolygon', coordinates: [[square()]] }, { name: 'Campo' })),
    );

    expect(features.map((item) => item.properties.name)).toEqual(['Campo']);
  });
});

describe('coordinate repair', () => {
  it('caps precision at 9 decimals, which the store enforces', () => {
    const ring = square().map(([lng, lat]) => [lng + 0.12345678912345, lat]);
    const { features } = normalizeFeatures(collection(polygon({}, ring)));

    for (const [lng] of features[0].geometry.coordinates[0]) {
      expect(String(lng).split('.')[1].length).toBeLessThanOrEqual(9);
    }
  });

  it('drops z and m values', () => {
    const ring = square().map(([lng, lat]) => [lng, lat, 120, 0]);
    const { features } = normalizeFeatures(collection(polygon({}, ring)));

    expect(features[0].geometry.coordinates[0].every((position) => position.length === 2)).toBe(
      true,
    );
  });

  it('closes an unclosed ring', () => {
    const open = square().slice(0, -1);
    const { features } = normalizeFeatures(collection(polygon({}, open)));
    const ring = features[0].geometry.coordinates[0];

    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring).toHaveLength(open.length + 1);
  });
});

describe('Paraguay bounds', () => {
  it('rejects valid lng/lat geometry outside Paraguay', () => {
    const paris = square().map(([lng, lat]) => [lng + 60.3, lat + 72.8]);

    expect(code(() => normalizeFeatures(collection(polygon({ name: 'París' }, paris))))).toBe(
      'out-of-paraguay',
    );
  });

  it('rejects small projected coordinates that slip the world-range check', () => {
    // A shapefile without its .prj whose local-grid numbers are ≤ 180: read as lng/lat
    // they land near (0,0) — the Gulf of Guinea failure this check exists to stop.
    const nearNullIsland = square().map(([lng, lat]) => [lng + 58, lat + 24]);

    expect(code(() => normalizeFeatures(collection(polygon({}, nearNullIsland))))).toBe(
      'out-of-paraguay',
    );
  });

  it('rejects the whole file when one polygon of several strays outside', () => {
    const outside = square().map(([lng, lat]) => [lng + 30, lat]);

    expect(code(() => normalizeFeatures(collection(polygon({}), polygon({}, outside))))).toBe(
      'out-of-paraguay',
    );
  });

  it('rejects the whole file when only an interior ring strays outside', () => {
    const strayHole = square().map(([lng, lat]) => [lng + 30, lat]);

    expect(code(() => normalizeFeatures(collection(polygon({}, square(), strayHole))))).toBe(
      'out-of-paraguay',
    );
  });
});

describe('naming', () => {
  it('prefers name, then nombre, case-insensitively', () => {
    const { features } = normalizeFeatures(
      collection(
        polygon({ name: 'By name', NOMBRE: 'ignored' }),
        polygon({ NOMBRE: 'By nombre' }),
        polygon({ TITLE: 'By title' }),
      ),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      'By name',
      'By nombre',
      'By title',
    ]);
  });

  it('falls back to a 1-based Polygon N and ignores non-string values', () => {
    const { features } = normalizeFeatures(
      collection(polygon({ name: 42 }), polygon({ name: '  ' }), polygon()),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      'Polígono 1',
      'Polígono 2',
      'Polígono 3',
    ]);
  });
});

describe('non-polygon input', () => {
  it('counts skipped points and lines into one warning', () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        polygon({ name: 'Kept' }),
        feature({ type: 'Point', coordinates: [0, 0] }),
        feature({
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        }),
      ),
    );

    expect(features).toHaveLength(1);
    expect(warnings).toEqual([{ message: 'Se omitieron 2 entidades que no son polígonos.' }]);
  });

  it('recurses into nested GeometryCollections', () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        feature(
          {
            type: 'GeometryCollection',
            geometries: [
              { type: 'Polygon', coordinates: [square()] },
              {
                type: 'GeometryCollection',
                geometries: [{ type: 'Polygon', coordinates: [square(10)] }],
              },
            ],
          },
          { name: 'Mixed' },
        ),
      ),
    );

    expect(features.map((item) => item.properties.name)).toEqual(['Mixed (1/2)', 'Mixed (2/2)']);
    expect(warnings).toEqual([]);
  });

  it('errors naming what was found when nothing is importable', () => {
    let caught: UploadError | undefined;

    try {
      normalizeFeatures(
        collection(
          feature({ type: 'Point', coordinates: [0, 0] }),
          feature({ type: 'Point', coordinates: [1, 1] }),
        ),
      );
    } catch (error) {
      caught = error as UploadError;
    }

    expect(caught?.code).toBe('no-polygons');
    expect(caught?.message).toContain('2 puntos');
  });

  it('errors on an empty FeatureCollection', () => {
    expect(code(() => normalizeFeatures(collection()))).toBe('empty');
  });
});

describe('root forms and ids', () => {
  it('accepts a lone Feature and a bare geometry as the file root', () => {
    expect(normalizeFeatures(polygon({ name: 'Lone' }) as UploadGeoJson).features).toHaveLength(1);
    expect(
      normalizeFeatures({ type: 'Polygon', coordinates: [square()] } as UploadGeoJson).features,
    ).toHaveLength(1);
  });

  it('mints a unique id per feature so auto-select can address them', () => {
    const { features } = normalizeFeatures(
      collection(feature({ type: 'MultiPolygon', coordinates: [[square(0)], [square(10)]] })),
    );

    expect(new Set(features.map((item) => item.id)).size).toBe(features.length);
  });
});

describe('normalizeUnknown', () => {
  it('rejects values that are not GeoJSON with an unreadable error', () => {
    expect(code(() => normalizeUnknown({ hello: 'world' }, 'GeoJSON'))).toBe('unreadable');
  });

  it('skips a malformed feature with a warning instead of rejecting the whole collection', () => {
    const twoPositionRing = feature({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 1],
        ],
      ],
    });

    const { features, warnings } = normalizeUnknown(
      collection(polygon({ name: 'Válido' }), twoPositionRing),
      'GeoJSON',
    );

    expect(features.map((item) => item.properties.name)).toEqual(['Válido']);
    expect(warnings.map((warning) => warning.message)).toContain('Se omitió 1 entidad no válida.');
  });

  it('errors when every feature in the collection is malformed', () => {
    expect(code(() => normalizeUnknown(collection({ type: 'Feature' }), 'GeoJSON'))).toBe('empty');
  });

  it('still hard-fails a malformed lone-feature root, which has nothing to degrade to', () => {
    const bare = feature({ type: 'Polygon', coordinates: [[[0, 0]]] });

    expect(code(() => normalizeUnknown(bare, 'GeoJSON'))).toBe('unreadable');
  });
});
