/** The geometries the static layers are built from: a Polygon's rings or a MultiPolygon's. */
export type AreaGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

/**
 * The same geometry with every coordinate rounded to `decimals` places and any altitude
 * dropped. Used by the `scripts/data/` build scripts before a GeoJSON is committed: the
 * sources carry float noise (`-56.79999999970016`) that would churn the file on every
 * regeneration and buys nothing at map precision. Pure and non-mutating.
 * No `@/` imports here — the build scripts load this module straight from Node.
 */
export function roundCoordinates<G extends AreaGeometry>(geometry: G, decimals: number): G {
  const factor = 10 ** decimals;
  const round = (value: number) => Math.round(value * factor) / factor;
  const roundRing = (ring: number[][]) => ring.map(([lng, lat]) => [round(lng), round(lat)]);

  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(roundRing) };
  }

  return {
    ...geometry,
    coordinates: geometry.coordinates.map((polygon) => polygon.map(roundRing)),
  };
}

/** How many positions a geometry holds, counting every ring of every part. */
export function vertexCount(geometry: AreaGeometry): number {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat(1);

  return rings.reduce((total, ring) => total + ring.length, 0);
}

/** `[west, south, east, north]` of every position in the geometry. */
export function geometryBounds(geometry: AreaGeometry): [number, number, number, number] {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat(1);
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }
  }

  return [west, south, east, north];
}
