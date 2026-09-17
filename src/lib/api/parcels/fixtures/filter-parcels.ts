import type {
  FilteredParcel,
  FilterParcelsRequest,
  FilterParcelsResponse,
} from '@/lib/api/parcels/schemas';
import { ringContains } from '@/lib/map/point-in-polygon';

/**
 * TODO(mock-filter-parcels): stand-in for `POST /api/parcels/filter_parcels` while the
 * endpoint is not reachable. Delete with the mock branch in `client.ts`.
 *
 * Mocked data that behaves like the endpoint: a fixed cadastre of irregular parcels
 * covers the world, and the answer is every parcel that intersects a filtering polygon
 * plus every parcel within `buffer` metres of one. A parcel is `selected` when the
 * share of its area inside a polygon reaches `overlap_percentage_threshold`; the rest
 * are the parcels "around".
 *
 * The cadastre is a lattice rotated off the meridians whose every corner is displaced
 * by a pseudo-random offset hashed from its indices. Neighbouring parcels share the
 * displaced corners, so they tile without gaps or overlaps while each one is its own
 * irregular quadrilateral — the look of real field boundaries, none of them tracing the
 * drawing. Deterministic and anchored to the world, not to the request: the same area
 * always yields the same parcels and ids.
 *
 * Geometry runs in a planar frame in metres (equirectangular, scaled at a fixed
 * Paraguayan latitude so the frame itself is world-fixed), accurate to a few percent
 * across the country and exact enough at parcel scale.
 */

/** Smallest parcel pitch; a big upload coarsens the lattice so the answer stays bounded. */
const MIN_PARCEL_SIDE_M = 250;

/** Upper bound on parcels per side of a polygon's extent. */
const MAX_PARCELS_PER_SIDE = 12;

/** How far a lattice corner may wander, as a share of the pitch. */
const JITTER = 0.32;

/** The lattice's tilt off north, so parcels never read as a map grid. */
const ROTATION_RAD = (17 * Math.PI) / 180;

/** Sample points per side when estimating a parcel's overlap; 25 points → 4 % steps. */
const SAMPLES = 5;

const METRES_PER_DEGREE = 111_320;

/** Latitude the longitude scale is fixed at: mid-Paraguay. A request must not move the frame. */
const REFERENCE_LAT_DEG = -24;

type XY = [number, number];
type Quad = [XY, XY, XY, XY, XY];

// ---- planar helpers ---------------------------------------------------------------

function rotate([x, y]: XY, angle: number): XY {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return [x * cos + y * sin, -x * sin + y * cos];
}

/** Metres from a point to a segment. */
function pointSegmentDistance([px, py]: XY, [ax, ay]: XY, [bx, by]: XY): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function segmentsCross(a: XY, b: XY, c: XY, d: XY): boolean {
  const orient = (p: XY, q: XY, r: XY) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);

  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
}

function segmentSegmentDistance(a: XY, b: XY, c: XY, d: XY): number {
  if (segmentsCross(a, b, c, d)) return 0;

  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}

function contains(ring: XY[], [x, y]: XY): boolean {
  return ringContains(ring, { lng: x, lat: y });
}

/** Metres between two closed rings' outlines; 0 when they cross or one holds the other's vertex. */
function ringDistance(a: XY[], b: XY[]): number {
  if (a.some((vertex) => contains(b, vertex)) || b.some((vertex) => contains(a, vertex))) {
    return 0;
  }

  let distance = Infinity;

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      distance = Math.min(distance, segmentSegmentDistance(a[i], a[i + 1], b[j], b[j + 1]));

      if (distance === 0) return 0;
    }
  }

  return distance;
}

/** Share of the parcel inside the polygon, 0–1, from a bilinear lattice of sample points. */
function overlapOf([a, b, c, d]: Quad, ring: XY[]): number {
  let inside = 0;

  for (let row = 0; row < SAMPLES; row++) {
    for (let col = 0; col < SAMPLES; col++) {
      const u = (col + 0.5) / SAMPLES;
      const v = (row + 0.5) / SAMPLES;
      const point: XY = [
        (1 - u) * (1 - v) * a[0] + u * (1 - v) * b[0] + u * v * c[0] + (1 - u) * v * d[0],
        (1 - u) * (1 - v) * a[1] + u * (1 - v) * b[1] + u * v * c[1] + (1 - u) * v * d[1],
      ];

      if (contains(ring, point)) inside++;
    }
  }

  return inside / (SAMPLES * SAMPLES);
}

// ---- the cadastre -----------------------------------------------------------------

/** Two pseudo-random numbers in [-1, 1) hashed from a lattice corner's indices. */
function jitterOf(i: number, j: number): XY {
  let h = (Math.imul(i, 73_856_093) ^ Math.imul(j, 19_349_663)) >>> 0;

  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h ^= h >>> 16;

  return [(h & 0xffff) / 0x8000 - 1, (h >>> 16) / 0x8000 - 1];
}

/** A lattice corner after its displacement, in the rotated frame. */
function cornerOf(i: number, j: number, side: number): XY {
  const [dx, dy] = jitterOf(i, j);

  return [(i + dx * JITTER) * side, (j + dy * JITTER) * side];
}

/** The parcel at lattice cell (col, row): its four shared corners, closed, in the rotated frame. */
function parcelAt(col: number, row: number, side: number): Quad {
  const a = cornerOf(col, row, side);
  const b = cornerOf(col + 1, row, side);
  const c = cornerOf(col + 1, row + 1, side);
  const d = cornerOf(col, row + 1, side);

  return [a, b, c, d, a];
}

/** One pitch for the whole request: fine for a field, coarser for an estate-sized upload. */
function parcelSide(rings: XY[][]): number {
  let extent = 0;

  for (const ring of rings) {
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);

    extent = Math.max(extent, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }

  return Math.max(MIN_PARCEL_SIDE_M, extent / MAX_PARCELS_PER_SIDE);
}

/** Stable, positive, unique per lattice cell; world-anchored so it survives redraws. */
function parcelIdOf(col: number, row: number): number {
  return (row + 100_000) * 1_000_000 + (col + 500_000);
}

type Candidate = { quad: Quad; overlap: number };

/** The fake endpoint: the parcels each polygon intersects or comes within the buffer of. */
export function mockFilterParcels(request: FilterParcelsRequest): FilterParcelsResponse {
  const { features } = request.filtering_polygons;
  const { buffer, overlap_percentage_threshold: threshold } = request;

  // Planar frame: metres east and north, then the cadastre's tilt applied, so lattice
  // cells are axis-aligned while we index them.
  const kx = METRES_PER_DEGREE * Math.cos((REFERENCE_LAT_DEG * Math.PI) / 180);
  const ky = METRES_PER_DEGREE;
  const rings: XY[][] = features.map((feature) =>
    feature.geometry.coordinates[0].map(([lng, lat]) => rotate([lng * kx, lat * ky], ROTATION_RAD)),
  );
  const side = parcelSide(rings);
  // Corners wander up to JITTER × side, so the search reaches that much further.
  const reach = buffer + JITTER * side;

  // A parcel near two polygons is answered once, with its largest overlap.
  const candidates = new Map<number, Candidate>();

  for (const ring of rings) {
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);
    const colMin = Math.floor((Math.min(...xs) - reach) / side);
    const colMax = Math.floor((Math.max(...xs) + reach) / side);
    const rowMin = Math.floor((Math.min(...ys) - reach) / side);
    const rowMax = Math.floor((Math.max(...ys) + reach) / side);

    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        const quad = parcelAt(col, row, side);
        const overlap = overlapOf(quad, ring);

        // Neither intersecting nor within the buffer: not a parcel "around".
        if (overlap === 0 && ringDistance(quad, ring) > buffer) continue;

        const id = parcelIdOf(col, row);
        const known = candidates.get(id);

        candidates.set(id, { quad, overlap: Math.max(overlap, known?.overlap ?? 0) });
      }
    }
  }

  const results: FilteredParcel[] = [...candidates.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, { quad, overlap }]) => ({
      parcel_id: id,
      geometry: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                quad.map((corner) => {
                  const [x, y] = rotate(corner, -ROTATION_RAD);

                  return [x / kx, y / ky] as XY;
                }),
              ],
            },
          },
        ],
      },
      // A parcel that only sits in the buffer never passes, whatever the threshold.
      selected: overlap > 0 && overlap * 100 >= threshold,
    }));

  return {
    status: 'success',
    message: '',
    input: { features: features.map((_, id) => ({ id })) },
    results,
  };
}
