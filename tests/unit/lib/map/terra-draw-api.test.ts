import {
  ValidationReasons,
  type GeoJSONStoreFeatures,
  type TerraDraw,
  type TerraDrawEvents,
} from 'terra-draw';
import { describe, expect, it } from 'vitest';

import { startedDraw } from './headless-draw';

/**
 * The Terra Draw surface `use-terra-draw.ts` and the `src/store` atoms depend on.
 *
 * Same idea as `terra-draw-compatibility.test.ts` one level up: the `satisfies` clauses
 * are the real assertions and they run under `typecheck`, so a Terra Draw upgrade that
 * renames an event or a method fails the build instead of failing silently on the map.
 */
const SUBSCRIBED_EVENTS = ['finish', 'change'] as const satisfies readonly TerraDrawEvents[];

const USED_METHODS = [
  'start',
  'stop',
  'on',
  'off',
  'setMode',
  'getSnapshot',
  'addFeatures',
  'removeFeatures',
  'clear',
  'enabled',
] as const satisfies readonly (keyof TerraDraw)[];

describe('terra-draw API', () => {
  it('subscribes to events Terra Draw still declares', () => {
    // The assertion that matters is the `satisfies` above, checked at compile time.
    expect(new Set(SUBSCRIBED_EVENTS).size).toBe(SUBSCRIBED_EVENTS.length);
  });

  it('calls methods Terra Draw still declares', () => {
    expect(new Set(USED_METHODS).size).toBe(USED_METHODS.length);
  });
});

const RING = [
  [-57.6, -25.3],
  [-57.6, -25.2],
  [-57.5, -25.2],
  [-57.6, -25.3],
];

const HOLE = [
  [-57.58, -25.28],
  [-57.58, -25.26],
  [-57.56, -25.26],
  [-57.58, -25.28],
];

function uploadFeature(geometry: unknown): GeoJSONStoreFeatures {
  return {
    id: crypto.randomUUID(),
    type: 'Feature',
    geometry,
    properties: { mode: 'polygon', origin: 'upload', name: 'Pinned' },
  } as GeoJSONStoreFeatures;
}

/**
 * The store constraints `src/lib/upload/normalize.ts` exists to satisfy, pinned at
 * runtime: if a Terra Draw upgrade starts accepting MultiPolygons or holes, these fail
 * and the explode/skip logic can be revisited (documented in `docs/upload-polygons.md`).
 */
describe('terra-draw addFeatures contract', () => {
  it('accepts a Polygon and keeps custom properties through getSnapshot', () => {
    const draw = startedDraw();
    const [validation] = draw.addFeatures([
      uploadFeature({ type: 'Polygon', coordinates: [RING] }),
    ]);

    expect(validation.valid).toBe(true);

    const [stored] = draw.getSnapshot();

    expect(stored.properties.origin).toBe('upload');
    expect(stored.properties.name).toBe('Pinned');
  });

  it('returns per-feature validations and still adds the valid features', () => {
    const draw = startedDraw();
    const validations = draw.addFeatures([
      uploadFeature({ type: 'Polygon', coordinates: [RING] }),
      uploadFeature({ type: 'MultiPolygon', coordinates: [[RING]] }),
    ]);

    expect(validations.map((validation) => validation.valid)).toEqual([true, false]);
    expect(draw.getSnapshot()).toHaveLength(1);
  });

  it('rejects MultiPolygons, which is why uploads explode them', () => {
    const draw = startedDraw();
    const [validation] = draw.addFeatures([
      uploadFeature({ type: 'MultiPolygon', coordinates: [[RING]] }),
    ]);

    expect(validation.valid).toBe(false);
  });

  it('rejects polygons with holes, which is why uploads skip them', () => {
    const draw = startedDraw();
    const [validation] = draw.addFeatures([
      uploadFeature({ type: 'Polygon', coordinates: [RING, HOLE] }),
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe(ValidationReasons.ValidationReasonFeatureHasHoles);
  });

  it('rejects coordinates with more than 9 decimals, which is why uploads round them', () => {
    const draw = startedDraw();
    const tooPrecise = RING.map(([lng, lat]) => [lng + 0.0000000001, lat]);
    const [validation] = draw.addFeatures([
      uploadFeature({ type: 'Polygon', coordinates: [tooPrecise] }),
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe(
      ValidationReasons.ValidationReasonFeatureInvalidCoordinatePrecision,
    );
  });
});
