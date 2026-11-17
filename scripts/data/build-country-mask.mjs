/**
 * Builds `public/data/paraguay-mask.geojson`: the world with Paraguay cut out, which the
 * maps paint as one dim fill so everything outside the country recedes
 * (`src/components/map/country-mask.tsx`).
 *
 *   node scripts/data/build-country-mask.mjs
 *
 * Source: geoBoundaries gbOpen, PRY ADM0, simplified variant — CC BY 4.0. Pinned to a
 * release commit so a re-run reproduces the same file; bump the commit deliberately.
 * geoBoundaries derives this outline from the DGEEC (2012). The full-resolution file is
 * ~39k vertices; the simplified one (~3.7k) keeps the river borders on their channels at
 * every zoom the app allows and ships at ~30 KB gzipped. When the client delivers an
 * official boundary, point `SOURCE_URL` at it (or read it locally) and re-run.
 *
 * Citation: Runfola, D. et al. (2020). geoBoundaries: A global database of political
 * administrative boundaries. PLoS ONE 15(4): e0231866.
 *
 * Coordinates are rounded to 5 decimals (~1 m) so the committed file is deterministic;
 * the output is a single Feature with the provenance as its only properties.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { outsideMask } from '../../src/lib/map/country-mask.ts';
import {
  geometryBounds,
  roundCoordinates,
  vertexCount,
} from '../../src/lib/map/geojson-precision.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(HERE, '../../public/data/paraguay-mask.geojson');

const RELEASE_COMMIT = '9469f09';
const SOURCE_URL =
  `https://github.com/wmgeolab/geoBoundaries/raw/${RELEASE_COMMIT}` +
  '/releaseData/gbOpen/PRY/ADM0/geoBoundaries-PRY-ADM0_simplified.geojson';

/** The map's own limits (`MAX_BOUNDS` in `src/lib/map/basemap.ts`): the outline must fit. */
const MAP_BOUNDS = [-66, -31, -51, -15];

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(`geoBoundaries answered ${response.status} for ${SOURCE_URL}`);
}

const collection = await response.json();

if (collection.type !== 'FeatureCollection' || collection.features.length !== 1) {
  throw new Error(`expected one feature, got ${JSON.stringify(collection).slice(0, 200)}`);
}

const [source] = collection.features;

if (source.geometry.type !== 'Polygon' && source.geometry.type !== 'MultiPolygon') {
  throw new Error(`expected a Polygon or MultiPolygon, got ${source.geometry.type}`);
}

const geometry = roundCoordinates(source.geometry, 5);
const [west, south, east, north] = geometryBounds(geometry);

if (
  west < MAP_BOUNDS[0] ||
  south < MAP_BOUNDS[1] ||
  east > MAP_BOUNDS[2] ||
  north > MAP_BOUNDS[3]
) {
  throw new Error(`boundary [${west}, ${south}, ${east}, ${north}] falls outside the map bounds`);
}

const feature = {
  type: 'Feature',
  properties: {
    name: 'Outside Paraguay',
    iso3: 'PRY',
    source: `geoBoundaries gbOpen ADM0 simplified (${RELEASE_COMMIT}), derived from DGEEC 2012`,
    licence: 'CC BY 4.0',
  },
  geometry: outsideMask(geometry),
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify({ type: 'FeatureCollection', features: [feature] })}\n`);

console.log(
  `wrote public/data/paraguay-mask.geojson: Paraguay ${geometry.type}, ${vertexCount(geometry)} vertices, ` +
    `bbox [${west}, ${south}, ${east}, ${north}]`,
);
