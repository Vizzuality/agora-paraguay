import type { ParcelCollection, ParcelFeature } from "@/lib/api/schemas";

/**
 * TODO(mock-parcels): this whole module is a stand-in. When the real parcel layer is
 * available, delete this file and remove every trace of the mock — grep for
 * `mock-parcels` to find all of them.
 *
 * Fake parcels for the mock API, mimicking the real cadastral pattern of the
 * Paraguayan Chaco as seen on the satellite basemap: large rectangular estate blocks,
 * each subdivided into strips of fields with varying widths, clustered together with
 * road-sized gaps between blocks and untouched land around them.
 *
 * Generation is hierarchical, which is what produces that look:
 *
 *   slots — a coarse grid over the region; a slot either stays empty (forest) or
 *   hosts one estate, so blocks never overlap by construction;
 *   estates — the slot's rectangle inset by a random road margin;
 *   parcels — the estate split into N columns × M rows with random strip widths,
 *   so fields inside a block are flush against each other like the imagery;
 *   jitter — every corner of that subdivision lattice is displaced by a bounded
 *   random offset. Neighbouring fields reference the same displaced corner, so
 *   edges stay perfectly shared (flush, never overlapping) while every parcel
 *   becomes an irregular quadrilateral instead of an axis-aligned rectangle.
 */

/** The seeded region (~150 km per side), centred near the initial camera. */
const EXTENT = { west: -59.2, south: -24.2, east: -57.7, north: -22.7 };

/** Coarse estate slots per side (~15 km each). */
const SLOTS = 10;

/** Share of slots that host an estate — the rest stay as untouched land. */
const ESTATE_SHARE = 0.55;

/** A field is occasionally skipped, leaving an unworked gap inside a block. */
const FIELD_SKIP = 0.06;

/**
 * mulberry32 — tiny seeded PRNG. Seeded so the fixture is deterministic: tests can
 * pin invariants and the map looks the same on every reload.
 */
function mulberry32(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

/**
 * `count` strip widths that sum to `total`. The 0.35 floor keeps every strip a usable
 * field — pure random shares produce slivers.
 */
function stripSizes(random: () => number, count: number, total: number) {
  const weights = Array.from({ length: count }, () => 0.35 + random());
  const sum = weights.reduce((acc, weight) => acc + weight, 0);

  return weights.map((weight) => (weight / sum) * total);
}

/** Cumulative boundaries [0, s1, s1+s2, …, total] from strip sizes. */
function boundaries(start: number, sizes: number[]) {
  const edges = [start];

  for (const size of sizes) edges.push(edges[edges.length - 1] + size);

  return edges;
}

/**
 * The subdivision lattice, with every corner displaced. The displacement is capped at
 * 30% of the narrowest strip, so displaced corners can never cross each other and the
 * lattice quads stay simple and non-overlapping.
 */
function jitteredCorners(random: () => number, columnEdges: number[], rowEdges: number[]) {
  const minColumn = Math.min(...columnEdges.slice(1).map((edge, i) => edge - columnEdges[i]));
  const minRow = Math.min(...rowEdges.slice(1).map((edge, i) => edge - rowEdges[i]));
  const amplitude = 0.3 * Math.min(minColumn, minRow);

  return columnEdges.map((lng) =>
    rowEdges.map(
      (lat) =>
        [
          lng + between(random, -amplitude, amplitude),
          lat + between(random, -amplitude, amplitude),
        ] as [number, number],
    ),
  );
}

function quad(corners: [number, number][][], col: number, row: number) {
  return {
    type: "Polygon",
    coordinates: [
      [
        corners[col][row],
        corners[col + 1][row],
        corners[col + 1][row + 1],
        corners[col][row + 1],
        corners[col][row],
      ],
    ],
  } satisfies ParcelFeature["geometry"];
}

export function generateParcelFixtures(seed = 20260826): ParcelCollection {
  const random = mulberry32(seed);
  const slotWidth = (EXTENT.east - EXTENT.west) / SLOTS;
  const slotHeight = (EXTENT.north - EXTENT.south) / SLOTS;
  const features: ParcelFeature[] = [];

  for (let slotCol = 0; slotCol < SLOTS; slotCol += 1) {
    for (let slotRow = 0; slotRow < SLOTS; slotRow += 1) {
      if (random() >= ESTATE_SHARE) continue;

      // The estate: the slot inset by a road-sized margin on every side.
      const west = EXTENT.west + slotCol * slotWidth + between(random, 0.02, 0.08) * slotWidth;
      const east =
        EXTENT.west + (slotCol + 1) * slotWidth - between(random, 0.02, 0.08) * slotWidth;
      const south = EXTENT.south + slotRow * slotHeight + between(random, 0.02, 0.08) * slotHeight;
      const north =
        EXTENT.south + (slotRow + 1) * slotHeight - between(random, 0.02, 0.08) * slotHeight;

      // The subdivision: strips of varying widths, like the survey pattern in the
      // imagery — some estates are a few broad fields, others many narrow ones.
      const columns = 2 + Math.floor(random() * 5);
      const rows = 2 + Math.floor(random() * 3);
      const columnEdges = boundaries(west, stripSizes(random, columns, east - west));
      const rowEdges = boundaries(south, stripSizes(random, rows, north - south));
      const corners = jitteredCorners(random, columnEdges, rowEdges);

      for (let col = 0; col < columns; col += 1) {
        for (let row = 0; row < rows; row += 1) {
          if (random() < FIELD_SKIP) continue;

          const id = `parcel-${features.length + 1}`;

          features.push({
            type: "Feature",
            properties: { id, name: `Parcela ${features.length + 1}` },
            geometry: quad(corners, col, row),
          });
        }
      }
    }
  }

  return { type: "FeatureCollection", features };
}

export const parcelFixtures = generateParcelFixtures();
